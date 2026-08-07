import { Component, EventEmitter, Output, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WizardStateService } from '../../services/wizard-state.service';
import { isPreconcedidoEntryBlocked } from '../../constants/prestamo-preconcedido-entry';
import {
  formatPreconcedidoImporte,
  PRECONCEDIDO_IMPORTE_MAX,
  defaultPreconcedidoSimulacionImporte
} from '../../constants/prestamo-preconcedido-offer';
import {
  PrestamoCocheInternalView,
  PrestamoFlowViewSlug,
  prestamoFlowViewToSlug,
  slugToPrestamoFlowView
} from '../../constants/prestamo-flow-routing';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { WizardState } from '../../services/wizard-state.service';
import { environment } from '../../../environments/environment';
import { NormativaVariant } from '../../constants/normativa-disponibles';

declare var lucide: any;

@Component({
  selector: 'app-prestamos',
  templateUrl: './prestamos.component.html',
  styleUrls: ['./prestamos.component.scss']
})
export class PrestamosComponent implements AfterViewInit, OnInit, OnDestroy {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  
  @ViewChild('originalSlider', { static: false }) originalSlider?: ElementRef;
  
  state$: Observable<WizardState>;

  // Vista interna: listado o simulación
  view: 'list' | 'simulation' = 'list';
  
  // Vista para Préstamo Coche; 'sabadell-flow' = flujo Préstamo Sabadell (no preconcedido)
  prestamoCocheView: PrestamoCocheInternalView = 'none';
  showPrestamoCocheOnboarding = false;
  
  // Datos del préstamo para pasar al resumen
  prestamoCocheData: any = null;

  /** Tras "Volver a simulación" desde la calculadora, al Continuar se vuelve a la calculadora */
  private returnToNormativaCalculadora = false;

  // Estado de simulación
  loanType: 'individual' | 'compartido' = 'compartido';
  amount = defaultPreconcedidoSimulacionImporte(PRECONCEDIDO_IMPORTE_MAX);
  termMonths = 96;
  monthlyPaymentDisplay = '250,00';
  showCalendar = false;
  formattedAmount = '35.000';
  amountInputValue = '35.000';
  amountError: string | null = null;
  minAmount = 3000;
  maxAmountIndividual = 8000;
  private readonly destroy$ = new Subject<void>();
  private pausePrestamoFlowSync = false;

  get preconcedidoImporteMax(): number {
    return this.wizardState.getCurrentState().preconcedidoImporteMax ?? PRECONCEDIDO_IMPORTE_MAX;
  }

  get preconcedidoImporteMaxLabel(): string {
    return formatPreconcedidoImporte(this.preconcedidoImporteMax);
  }

  get maxAmountCompartido(): number {
    return this.preconcedidoImporteMax;
  }

  get normativaVariant(): NormativaVariant {
    return environment.normativaVariant ?? 'classic';
  }

  get normativaCuotaMensual(): number {
    const cuota = this.prestamoCocheData?.monthlyPayment;
    return typeof cuota === 'number' && cuota > 0 ? cuota : 0;
  }

  get maxAmount(): number {
    return this.loanType === 'individual' ? this.maxAmountIndividual : this.maxAmountCompartido;
  }
  get minAmountFormatted(): string {
    return this.minAmount.toLocaleString('es-ES');
  }
  get maxAmountFormatted(): string {
    return this.maxAmount.toLocaleString('es-ES');
  }
  isInputFocused = false;
  
  // Recomendaciones
  showRecommendation = false;
  recommendationMessage = '';
  recommendationType: 'more' | 'less' | 'credit-card' | null = null;
  showReactiveLoanCTA = false;
  showCreditCardCTA = false;
  
  // Modal de préstamo reactivo
  showReactiveLoanModal = false;

  // Modal confirmación salir del flujo préstamo con seguro
  showExitConfirmModal = false;

  /** Tras declinar por normativa 40%, el listado muestra Préstamo Digital en lugar del preconcedido */
  hidePreconcedidoCard = false;
  
  // Formulario de préstamo reactivo
  reactiveLoanForm = {
    importe: 0,
    finalidad: '',
    ingresosMensuales: 0,
    gastosMensuales: 0,
    situacionLaboral: '',
    tipoVivienda: '',
    aceptaTerminos: false
  };

  // Estado de salud financiera
  hasUpdatedPotential = false;
  financialHealthStatus: 'optima' | 'buena' | 'atencion' = 'optima';
  financialHealthMessage = '';
  recommendedMonthlyPayment = 0;

  constructor(private wizardState: WizardStateService) {
    this.state$ = this.wizardState.state$;
  }

  ngOnInit(): void {
    if (isPreconcedidoEntryBlocked()) {
      this.hidePreconcedidoCard = true;
    }

    this.state$
      .pipe(
        map(s => ({
          step: s.currentStep,
          slug: s.prestamoFlowSlug ?? null,
          pendientePreconcedido: s.pendientePreconcedidoOnboarding ?? false,
          pendienteSabadell: s.pendientePrestamoSabadellDesdePosicion ?? false,
          importeMax: s.preconcedidoImporteMax ?? PRECONCEDIDO_IMPORTE_MAX,
          hasUpdated: s.hasUpdatedPotential ?? false
        })),
        distinctUntilChanged(
          (a, b) =>
            a.step === b.step &&
            a.slug === b.slug &&
            a.pendientePreconcedido === b.pendientePreconcedido &&
            a.pendienteSabadell === b.pendienteSabadell &&
            a.importeMax === b.importeMax &&
            a.hasUpdated === b.hasUpdated
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(state => {
        const previousHasUpdated = this.hasUpdatedPotential;
        this.hasUpdatedPotential = state.hasUpdated;

        if (this.hasUpdatedPotential) {
          this.calculateFinancialHealth();
          if (!previousHasUpdated && typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 100);
          }
        }

        if (isPreconcedidoEntryBlocked()) {
          this.hidePreconcedidoCard = true;
        }

        if (state.step === 3) {
          this.pausePrestamoFlowSync = true;
          this.applyPrestamoFlowFromSlug(state.slug);
          this.pausePrestamoFlowSync = false;

          if (state.pendientePreconcedido && !isPreconcedidoEntryBlocked()) {
            this.wizardState.clearPendientePreconcedidoOnboarding();
            setTimeout(() => this.onIrAPrestamoCoche(), 0);
          } else if (state.pendienteSabadell) {
            this.wizardState.clearPendientePrestamoSabadellDesdePosicion();
            setTimeout(() => this.onIrAPrestamoSabadell(), 0);
          }
        }

        if (state.importeMax !== this.amount && this.prestamoCocheView === 'none') {
          this.amount = defaultPreconcedidoSimulacionImporte(state.importeMax);
          this.updateFormattedAmount();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
    this.updateFormattedAmount();
    // Calcular salud financiera si tiene scoring al cargar
    if (this.hasUpdatedPotential) {
      this.calculateFinancialHealth();
    }
    
    // Configurar listener para el slider original de Galatea
    this.setupOriginalSlider();
  }

  private setupOriginalSlider(): void {
    // Escuchar eventos del bs-slider original
    setTimeout(() => {
      const slider = this.originalSlider?.nativeElement || document.querySelector('bs-slider');
      if (slider) {
        // Escuchar diferentes posibles nombres de eventos
        const eventNames = ['valueChange', 'value-change', 'change', 'input', 'bs-value-change'];
        
        eventNames.forEach(eventName => {
          slider.addEventListener(eventName, (event: Event) => {
            const customEvent = event as CustomEvent;
            this.onOriginalSliderChange(customEvent);
          });
        });
        
        // También escuchar cambios en la propiedad value directamente
        this.observeSliderValue(slider);
        
        // Forzar actualización inicial
        this.updateOriginalSlider();
      }
    }, 500);
  }

  private observeSliderValue(slider: any): void {
    // Usar MutationObserver para detectar cambios en atributos
    // Los Web Components pueden cambiar propiedades sin emitir eventos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          const newValue = parseInt(slider.value || slider.getAttribute('value') || this.amount.toString(), 10);
          if (!isNaN(newValue) && newValue !== this.amount) {
            this.amount = newValue;
            this.updateFormattedAmount();
            this.updateMonthlyPayment();
            this.checkRecommendations(newValue);
            if (this.hasUpdatedPotential) {
              this.calculateFinancialHealth();
            }
          }
        }
      });
    });
    
    // Observar cambios en atributos y propiedades
    observer.observe(slider, {
      attributes: true,
      attributeFilter: ['value'],
      attributeOldValue: true
    });
  }

  // Métodos para el componente Galatea mejorado
  onAmountChangeFromGalatea(newValue: number): void {
    this.amount = newValue;
    this.updateFormattedAmount();
    this.updateMonthlyPayment();
    this.checkRecommendations(newValue);
    if (this.hasUpdatedPotential) {
      this.calculateFinancialHealth();
    }
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onErrorFromGalatea(errorMessage: string): void {
    // Manejar errores del componente Galatea si es necesario
    console.log('Error from Galatea slider:', errorMessage);
  }

  // Método para sincronizar con el slider original de Galatea
  onOriginalSliderChange(event: CustomEvent): void {
    let newValue: number;
    
    // Intentar obtener el valor de diferentes formas
    if (event.detail) {
      newValue = typeof event.detail === 'object' && event.detail.value !== undefined 
        ? parseInt(event.detail.value, 10)
        : parseInt(event.detail, 10);
    } else {
      // Si no hay detail, intentar obtener del target
      const target = event.target as any;
      newValue = target?.value ? parseInt(target.value, 10) : this.amount;
    }
    
    if (!isNaN(newValue) && newValue !== this.amount) {
      this.amount = newValue;
      this.updateFormattedAmount();
      this.updateMonthlyPayment();
      this.checkRecommendations(newValue);
      if (this.hasUpdatedPotential) {
        this.calculateFinancialHealth();
      }
    }
  }

  private updateOriginalSlider(): void {
    // Actualizar el valor del slider original cuando cambie amount
    setTimeout(() => {
      const slider = this.originalSlider?.nativeElement || document.querySelector('bs-slider');
      if (slider) {
        // Actualizar propiedades del Web Component
        // Intentar múltiples formas de actualizar el valor
        const newValue = this.amount.toString();
        const currentValue = slider.value || slider.getAttribute('value') || '';
        
        if (currentValue !== newValue) {
          // Actualizar propiedad
          if (slider.value !== undefined) {
            slider.value = newValue;
          }
          // Actualizar atributo
          slider.setAttribute('value', newValue);
          // Intentar actualizar mediante método si existe
          if (typeof slider.setValue === 'function') {
            slider.setValue(newValue);
          }
        }
        
        // También actualizar min y max si han cambiado
        const newMin = this.minAmount.toString();
        const currentMin = slider.minValue || slider.getAttribute('min-value') || '';
        if (currentMin !== newMin) {
          if (slider.minValue !== undefined) {
            slider.minValue = newMin;
          }
          slider.setAttribute('min-value', newMin);
        }
        
        const newMax = this.maxAmount.toString();
        const currentMax = slider.maxValue || slider.getAttribute('max-value') || '';
        if (currentMax !== newMax) {
          if (slider.maxValue !== undefined) {
            slider.maxValue = newMax;
          }
          slider.setAttribute('max-value', newMax);
        }
      }
    }, 0);
  }

  onIrASimulacion(): void {
    this.view = 'simulation';
    this.updateMonthlyPayment();
    this.updateFormattedAmount();
    this.checkRecommendations(this.amount);
    if (this.hasUpdatedPotential) {
      this.calculateFinancialHealth();
    }
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onVolverListado(): void {
    this.view = 'list';
  }

  onVolver(): void {
    this.previous.emit();
  }

  /** Chat en cabecera del listado «Contratar préstamos» (extensible a canal de ayuda) */
  onPrestamosListChat(): void {
    // Integración con chat / FAQ cuando exista flujo definido
  }

  onAmountChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.amount = value;
    this.updateFormattedAmount();
    this.updateMonthlyPayment();
    this.checkRecommendations(value);
    if (this.hasUpdatedPotential) {
      this.calculateFinancialHealth();
    }
    // Actualizar slider original
    this.updateOriginalSlider();
  }

  onAmountInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Guardar el valor sin formatear para permitir escritura fluida
    this.amountInputValue = value;
    
    // Eliminar todo excepto números y puntos (para separadores de miles)
    const cleanValue = value.replace(/[^\d.]/g, '').replace(/\./g, '');
    
    if (cleanValue === '') {
      this.amountInputValue = '';
      this.formattedAmount = '';
      this.amountError = null;
      this.checkRecommendations(0);
      return;
    }
    
    // Convertir a número
    const numValue = parseInt(cleanValue, 10);
    
    if (isNaN(numValue)) {
      this.amountError = null;
      this.checkRecommendations(0);
      return;
    }
    
    // Validar rango
    if (numValue < this.minAmount || numValue > this.maxAmount) {
      this.amountError = `La cantidad debe estar entre ${this.minAmount.toLocaleString('es-ES')} € y ${this.maxAmount.toLocaleString('es-ES')} €`;
      this.amount = numValue; // Mantener el valor para mostrar el error
      this.checkRecommendations(numValue);
      // Reinicializar iconos si hay error
      setTimeout(() => {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 0);
    } else {
      this.amountError = null;
      this.amount = numValue;
      this.updateMonthlyPayment();
      this.checkRecommendations(numValue);
      if (this.hasUpdatedPotential) {
        this.calculateFinancialHealth();
      }
    }
    
    // Actualizar slider
    // Formatear para mostrar
    this.updateFormattedAmount();
    // Actualizar slider original
    this.updateOriginalSlider();
  }

  onAmountInputFocus(): void {
    this.isInputFocused = true;
    // Mostrar el valor sin formatear mientras se escribe
    if (!this.amountInputValue) {
      this.amountInputValue = '';
    }
  }

  onAmountInputBlur(): void {
    this.isInputFocused = false;
    // Si hay error, ajustar al rango válido
    if (this.amount < this.minAmount) {
      this.amount = this.minAmount;
      this.amountError = null;
    } else if (this.amount > this.maxAmount) {
      this.amount = this.maxAmount;
      this.amountError = null;
    }
    
    this.updateFormattedAmount();
    this.amountInputValue = this.formattedAmount;
  }

  clearAmountInput(): void {
    this.amountInputValue = '';
    this.formattedAmount = '';
    this.amountError = null;
    // No resetear amount para mantener el slider
    // Enfocar el input después de limpiar
    setTimeout(() => {
      const input = document.getElementById('amount-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }

  onAmountInputKeydown(event: KeyboardEvent): void {
    // Permitir teclas de navegación, borrado y números
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    if (allowedKeys.includes(event.key)) {
      return;
    }
    
    // Permitir Ctrl/Cmd + A, C, V, X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }
    
    // Solo permitir números
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private updateFormattedAmount(): void {
    // Formatear con separadores de miles (punto en español)
    this.formattedAmount = this.amount.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    // Sincronizar el valor del input solo si no está en foco
    if (!this.isInputFocused) {
      this.amountInputValue = this.formattedAmount;
    }
  }

  selectTerm(months: number): void {
    this.termMonths = months;
    this.updateMonthlyPayment();
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  selectLoanType(type: 'individual' | 'compartido'): void {
    this.loanType = type;
    
    // Ajustar el amount si está fuera del nuevo rango
    if (this.amount > this.maxAmount) {
      this.amount = this.maxAmount;
      this.updateFormattedAmount();
      this.updateMonthlyPayment();
    } else if (this.amount < this.minAmount) {
      this.amount = this.minAmount;
      this.updateFormattedAmount();
      this.updateMonthlyPayment();
    }
    
    // Actualizar input value
    this.amountInputValue = this.formattedAmount;
    
    // Verificar recomendaciones
    this.checkRecommendations(this.amount);
    
    // Recalcular salud financiera si tiene scoring
    if (this.hasUpdatedPotential) {
      this.calculateFinancialHealth();
    }
  }

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar && typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  getTermYears(): number {
    return Math.round(this.termMonths / 12);
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCalendarYears(): number[] {
    const currentYear = this.getCurrentYear();
    const years = [];
    const totalYears = this.getTermYears();
    for (let i = 0; i <= totalYears; i++) {
      years.push(currentYear + i);
    }
    return years;
  }

  getCurrentYearIndex(): number {
    return this.getTermYears();
  }
  
  private checkRecommendations(amount: number): void {
    // Si el usuario necesita más de lo disponible
    if (amount > this.maxAmount) {
      this.showRecommendation = true;
      this.recommendationType = 'more';
      if (this.loanType === 'individual') {
        this.recommendationMessage = 'Para importes superiores a 8.000 €, considera un préstamo compartido';
        this.showReactiveLoanCTA = false;
      } else {
        // Para compartido, si supera 45.000€, recomendar préstamo reactivo digital
        this.recommendationMessage = '¿Necesitas más de 45.000 €? Rellena unos datos y estudiaremos tu caso';
        this.showReactiveLoanCTA = true;
      }
    }
    // Si el usuario está en el entorno del mínimo (<= 3.000 €)
    else if (amount <= this.minAmount && amount > 0) {
      this.showRecommendation = true;
      this.recommendationType = 'credit-card';
      this.recommendationMessage = 'Para importes inferiores a 3.000 €, te recomendamos usar una tarjeta de crédito';
      this.showReactiveLoanCTA = false;
      this.showCreditCardCTA = true;
    }
    // Si está en el rango válido pero cerca del límite
    else if (amount >= this.maxAmount * 0.9 && amount <= this.maxAmount) {
      this.showRecommendation = true;
      this.recommendationType = 'more';
      if (this.loanType === 'individual') {
        this.recommendationMessage = 'Estás cerca del límite. Considera un préstamo compartido para más flexibilidad';
        this.showReactiveLoanCTA = false;
      } else {
        // Para compartido cerca del límite, también puede necesitar más
        this.recommendationMessage = '¿Necesitas más de 45.000 €? Rellena unos datos y estudiaremos tu caso';
        this.showReactiveLoanCTA = true;
      }
    }
    // Si no hay necesidad de recomendación
    else {
      this.showRecommendation = false;
      this.recommendationType = null;
      this.recommendationMessage = '';
      this.showReactiveLoanCTA = false;
      this.showCreditCardCTA = false;
    }
  }

  onIrAPrestamoReactivo(): void {
    this.reactiveLoanForm.importe = this.amount;
    this.showReactiveLoanModal = true;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onCerrarModalReactivo(): void {
    this.showReactiveLoanModal = false;
    // Resetear formulario
    this.reactiveLoanForm = {
      importe: this.amount,
      finalidad: '',
      ingresosMensuales: 0,
      gastosMensuales: 0,
      situacionLaboral: '',
      tipoVivienda: '',
      aceptaTerminos: false
    };
  }

  onEnviarSolicitudReactivo(): void {
    // Aquí se enviaría la solicitud al backend
    console.log('Enviar solicitud de préstamo reactivo:', this.reactiveLoanForm);
    // TODO: Implementar envío de formulario
    // Después de enviar, cerrar modal y mostrar confirmación
    this.showReactiveLoanModal = false;
    // Mostrar mensaje de confirmación
    alert('Tu solicitud ha sido enviada. Nos pondremos en contacto contigo en breve.');
  }

  onIrATarjetaCredito(): void {
    // Redirigir a contratación de tarjeta de crédito
    console.log('Redirigir a contratación de tarjeta de crédito');
    // TODO: Implementar navegación a contratación de tarjeta
    // Por ejemplo: this.router.navigate(['/contratar/tarjeta']);
    alert('Redirigiendo a contratación de tarjeta de crédito...');
  }

  private updateMonthlyPayment(): void {
    const factor = 1.25; // mismo mock que el HTML de referencia
    const result = (this.amount * factor) / this.termMonths;
    // Formato español con coma y dos decimales
    const formatted = result.toFixed(2).replace('.', ',');
    this.monthlyPaymentDisplay = formatted;
    
    // Recalcular salud financiera si tiene scoring actualizado
    if (this.hasUpdatedPotential) {
      this.calculateFinancialHealth();
    }
  }

  private calculateFinancialHealth(): void {
    const state = this.wizardState.getCurrentState();
    const perfil = state.perfilFinanciero;
    
    if (!perfil || perfil.ingresos === 0) {
      this.financialHealthStatus = 'optima';
      this.financialHealthMessage = 'Tu capacidad de financiación está dentro de un rango saludable.';
      this.initializeIcons();
      return;
    }

    const disponible = perfil.ingresos - perfil.gastos;
    const cuotaActual = parseFloat(this.monthlyPaymentDisplay.replace(',', '.'));
    
    // Calcular cuota recomendada según tipo de préstamo
    // Individual: más conservador (25% del disponible)
    // Compartido: más flexible (15% del disponible por titular, asumiendo 2)
    const ratioRecomendado = this.loanType === 'individual' ? 0.25 : 0.15; // 15% por titular en compartido
    this.recommendedMonthlyPayment = disponible * ratioRecomendado;
    
    // Determinar estado de salud
    const ratioCuota = cuotaActual / disponible;
    
    if (cuotaActual <= this.recommendedMonthlyPayment) {
      this.financialHealthStatus = 'optima';
      if (this.loanType === 'individual') {
        this.financialHealthMessage = `Con esta cuota, estás dentro de un rango saludable para tu perfil.`;
      } else {
        this.financialHealthMessage = `Entre los dos, esta cuota se mantiene en un rango cómodo para vuestro perfil.`;
      }
    } else if (cuotaActual <= this.recommendedMonthlyPayment * 1.2) {
      this.financialHealthStatus = 'buena';
      if (this.loanType === 'individual') {
        this.financialHealthMessage = `Esta cuota está en un rango adecuado. Mantendrás una buena capacidad de ahorro.`;
      } else {
        this.financialHealthMessage = `Esta cuota es asumible entre los dos titulares.`;
      }
    } else {
      this.financialHealthStatus = 'atencion';
      // Mensaje neutro que no perjudique la conversión
      if (this.loanType === 'individual') {
        this.financialHealthMessage = `Con esta cuota, dedicarías aproximadamente ${Math.round(ratioCuota * 100)}% de tus ingresos disponibles al préstamo.`;
      } else {
        this.financialHealthMessage = `Esta cuota representa un compromiso importante. Considera si es el momento adecuado.`;
      }
    }
    
    this.initializeIcons();
  }

  private initializeIcons(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  private setPrestamoFlowView(
    view: PrestamoCocheInternalView,
    options?: { showOnboarding?: boolean }
  ): void {
    this.prestamoCocheView = view;
    if (options?.showOnboarding !== undefined) {
      this.showPrestamoCocheOnboarding = options.showOnboarding;
    }
    if (!this.pausePrestamoFlowSync) {
      const slug = prestamoFlowViewToSlug(view, this.showPrestamoCocheOnboarding);
      this.wizardState.setPrestamoFlowSlug(slug);
    }
  }

  private applyPrestamoFlowFromSlug(slug: PrestamoFlowViewSlug | null): void {
    if (!slug) {
      this.prestamoCocheView = 'none';
      this.showPrestamoCocheOnboarding = false;
      return;
    }
    const patch = slugToPrestamoFlowView(slug);
    if (!patch) {
      return;
    }
    this.prestamoCocheView = patch.view;
    if (patch.showOnboarding !== undefined) {
      this.showPrestamoCocheOnboarding = patch.showOnboarding;
    }
  }

  // Métodos para Préstamo Coche
  /** Entrada desde la tarjeta «Préstamo Sabadell» (flujo manual: onboarding → simulación propia) */
  onIrAPrestamoSabadell(): void {
    this.setPrestamoFlowView('sabadell-flow');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 0);
    }
  }

  onPrestamoSabadellFlowClose(): void {
    this.setPrestamoFlowView('none');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 0);
    }
  }

  onIrAPrestamoCoche(): void {
    this.setPrestamoFlowView('simulation', { showOnboarding: true });
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheStartSimulation(): void {
    this.setPrestamoFlowView('simulation', { showOnboarding: false });
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheBack(): void {
    this.setPrestamoFlowView('none', { showOnboarding: false });
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheClose(): void {
    this.returnToNormativaCalculadora = false;
    this.setPrestamoFlowView('none');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onCloseRequestedPrestamoCoche(): void {
    this.showExitConfirmModal = true;
  }

  onExitConfirmContinue(): void {
    this.showExitConfirmModal = false;
  }

  onExitConfirmLeave(): void {
    this.showExitConfirmModal = false;
    this.onPrestamoCocheClose();
  }

  onPrestamoCocheNext(data?: any): void {
    // Guardar datos del préstamo si se proporcionan
    if (data) {
      this.prestamoCocheData = data;
    }
    if (this.returnToNormativaCalculadora) {
      this.returnToNormativaCalculadora = false;
      this.setPrestamoFlowView('normativa-calculadora');
      this.initializeIcons();
      return;
    }
    // Navegar al resumen
    this.setPrestamoFlowView('resumen');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheResumenBack(): void {
    this.setPrestamoFlowView('simulation');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  /** Desde normativa (KO 40%): tras spinner → onboarding Préstamo Sabadell (no preconcedido) */
  onNormativaViewOtherLoans(): void {
    this.hidePreconcedidoCard = true;
    this.setPrestamoFlowView('sabadell-flow', { showOnboarding: false });
    this.initializeIcons();
  }

  /** Desde normativa: usuario declina y va a Posición Global */
  onNormativaGoToPosicionGlobal(): void {
    this.hidePreconcedidoCard = true;
    this.setPrestamoFlowView('none');
    this.wizardState.setCurrentStep(1);
    this.initializeIcons();
  }

  onPrestamoCocheResumenNext(): void {
    this.setPrestamoFlowView('normativa');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheNormativaBack(): void {
    this.setPrestamoFlowView('resumen');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheNormativaOpenCalculator(): void {
    this.setPrestamoFlowView('normativa-calculadora');
    this.initializeIcons();
  }

  onPrestamoCocheCalculadoraClose(): void {
    this.setPrestamoFlowView('normativa');
    this.initializeIcons();
  }

  onPrestamoCocheCalculadoraAdjustSimulation(): void {
    this.returnToNormativaCalculadora = true;
    this.setPrestamoFlowView('simulation', { showOnboarding: false });
    this.initializeIcons();
  }

  onPrestamoCocheNormativaRejected(): void {
    this.setPrestamoFlowView('normativa-unavailable');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }

  onPrestamoCocheNormativaAccepted(): void {
    // Mostrar loading antes de navegar al gestor documental
    this.setPrestamoFlowView('document-loading');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
    // Después de 7 segundos (tiempo suficiente para leer), navegar al gestor documental
    setTimeout(() => {
      this.setPrestamoFlowView('document-manager');
      if (typeof lucide !== 'undefined') {
        setTimeout(() => {
          lucide.createIcons();
        }, 100);
      }
    }, 7000);
  }

  onPrestamoCocheDocumentManagerComplete(): void {
    // Navegar a la pantalla de firma
    this.setPrestamoFlowView('firma');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheDocumentManagerExit(): void {
    // Volver al resumen
    this.setPrestamoFlowView('resumen');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheFirmaComplete(): void {
    const hasInsurance = this.prestamoCocheData?.hasInsurance === true;

    if (hasInsurance) {
      // Con seguro: spinner de documentación del seguro → documentos seguro → firma seguro → loading final → confirmación
      this.setPrestamoFlowView('seguro-loading');
      const loadingTime = 5000 + Math.random() * 1000;
      setTimeout(() => {
        this.setPrestamoFlowView('seguro-document-manager');
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      }, loadingTime);
    } else {
      // Sin seguro: solo firma del préstamo → loading final → confirmación (sin info de seguro)
      this.setPrestamoFlowView('final-loading');
      const loadingTime = 3000 + Math.random() * 2000;
      setTimeout(() => {
        this.setPrestamoFlowView('confirmacion');
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      }, loadingTime);
    }
  }

  onPrestamoCocheSeguroDocumentManagerComplete(): void {
    // Navegar a la firma del seguro
    this.setPrestamoFlowView('seguro-firma');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheSeguroDocumentManagerExit(): void {
    // Volver al resumen
    this.setPrestamoFlowView('resumen');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheSeguroFirmaComplete(): void {
    // Mostrar spinner de carga final
    this.setPrestamoFlowView('final-loading');
    
    // Simular carga durante 3-5 segundos
    const loadingTime = 3000 + Math.random() * 2000;
    
    setTimeout(() => {
      // Navegar a la pantalla de confirmación
      this.setPrestamoFlowView('confirmacion');
      if (typeof lucide !== 'undefined') {
        setTimeout(() => {
          lucide.createIcons();
        }, 100);
      }
    }, loadingTime);
  }

  onPrestamoCocheSeguroFirmaBack(): void {
    // Volver al gestor documental del seguro
    this.setPrestamoFlowView('seguro-document-manager');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  onPrestamoCocheConfirmacionNext(): void {
    // Marcar el préstamo como completado en el servicio de estado
    if (this.prestamoCocheData && this.prestamoCocheData.amount) {
      this.wizardState.markLoanCompleted(this.prestamoCocheData.amount);
    }
    // Cerrar flujo de préstamo y llevar al inicio (Posición Global)
    this.setPrestamoFlowView('none');
    this.wizardState.setCurrentStep(1);
  }

  onPrestamoCocheVerIngreso(): void {
    // Marcar el préstamo como completado e ir al inicio mostrando la cuenta
    if (this.prestamoCocheData && this.prestamoCocheData.amount) {
      this.wizardState.markLoanCompleted(this.prestamoCocheData.amount);
    }
    this.setPrestamoFlowView('none');
    this.wizardState.setCurrentStep(1);
    // Señal para abrir directamente la vista de cuentas desde Posición Global (opcional)
    sessionStorage.setItem('open-accounts-from-loan', 'true');
  }

  onPrestamoCocheFirmaBack(): void {
    // Volver al gestor documental
    this.setPrestamoFlowView('document-manager');
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

}
