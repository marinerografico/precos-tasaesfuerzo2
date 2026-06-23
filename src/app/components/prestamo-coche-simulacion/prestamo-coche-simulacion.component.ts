import { Component, EventEmitter, Input, Output, AfterViewInit, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { PrestamoCocheResumenData } from '../prestamo-coche-resumen/prestamo-coche-resumen.component';
import { PRESTAMO_FAQS, SEGURO_FAQS } from '../../constants/prestamo-coche-faq';
import {
  defaultPreconcedidoSimulacionImporte,
  PRECONCEDIDO_IMPORTE_MAX,
  PRECONCEDIDO_IMPORTE_MIN
} from '../../constants/prestamo-preconcedido-offer';

declare var lucide: any;

@Component({
  selector: 'app-prestamo-coche-simulacion',
  templateUrl: './prestamo-coche-simulacion.component.html',
  styleUrls: ['./prestamo-coche-simulacion.component.scss']
})
export class PrestamoCocheSimulacionComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() importeMax = PRECONCEDIDO_IMPORTE_MAX;
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<PrestamoCocheResumenData>();
  @Output() closeRequested = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  /** Oculta módulo de seguro y flujos asociados en simulación (reactivar: true). */
  showInsuranceModule = false;

  // Estado del formulario
  minAmount = PRECONCEDIDO_IMPORTE_MIN;
  maxAmount = PRECONCEDIDO_IMPORTE_MAX;
  amount = defaultPreconcedidoSimulacionImporte(this.maxAmount);
  termMonths = 96;
  monthlyPayment = 250.00;
  hasInsurance = false;
  insuranceCost = 11.20;
  insuranceFirstReceipt = 12.50;

  // Estado del input (formato inicial 75%)
  amountInputValue = this.amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  isInputFocused = false;
  amountError: string | null = null;

  // TIN y TAE
  tin = 4.00;
  tae = 4.84;

  // Drawer de información del seguro
  showInsuranceDrawer = false;

  // Modal médico
  showMedicalModal = false;

  // Modal de confirmación: usuario confirma que ha leído y marca "padezco condición médica"

  // Si el usuario confirma que padece condición médica, no se muestra ni el bloque de seguro ni su titular/bodycopy
  hasDeclaredMedicalCondition = false;

  // Estado del checkbox del seguro (deshabilitado si rechazó condiciones médicas)
  isInsuranceDisabled = false;

  // Toast de notificación
  showToast = false;
  toastMessage = 'Tus datos serán enviados a la aseguradora si avanza con el proceso de contratación del seguro.';
  toastType: 'info' | 'alert' = 'info';

  // Modal FAQs
  showFaqModal = false;
  faqActiveTab: 'prestamo' | 'seguro' = 'prestamo';
  expandedPrestamoId: number | null = null;
  expandedSeguroId: number | null = null;
  prestamoFaqs = PRESTAMO_FAQS;
  seguroFaqs = SEGURO_FAQS;

  // Consentimiento compartir datos con aseguradora (cuando importe no es múltiplo de 500)
  get amountIsMultipleOf500(): boolean {
    return this.amount % 500 === 0;
  }
  userAcceptedDataShare = false;
  dataShareAccepted = false;
  loadingInsuranceQuote = false;

  ngOnInit(): void {
    this.applyImporteMax(this.importeMax);
    this.updateMonthlyPayment();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['importeMax'] && !changes['importeMax'].firstChange) {
      this.applyImporteMax(changes['importeMax'].currentValue);
      this.updateMonthlyPayment();
    }
  }

  private applyImporteMax(importeMax: number): void {
    const max = importeMax || PRECONCEDIDO_IMPORTE_MAX;
    this.maxAmount = max;
    this.amount = defaultPreconcedidoSimulacionImporte(max);
    this.amountInputValue = this.amount.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    this.amountError = null;
  }

  ngAfterViewInit(): void {
    // Asegurar que la pantalla del flujo se muestre siempre desde arriba
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
      const wizard = document.querySelector('.wizard-content');
      if (wizard) {
        (wizard as HTMLElement).scrollTop = 0;
      }
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  /** Cambio de importe desde el slider (app-amount-slider-galatea): sincroniza con plazos y cuota. */
  onAmountChange(newValue: number): void {
    if (newValue === this.amount) return;
    if (isNaN(newValue) || newValue < this.minAmount || newValue > this.maxAmount) return;
    this.amount = newValue;
    this.amountInputValue = newValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    this.amountError = null;
    this.updateMonthlyPayment();
    this.cdr.detectChanges();
  }

  onBack(): void {
    this.back.emit();
  }

  onCloseRequest(): void {
    this.closeRequested.emit();
  }

  onDataShareCheckChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.dataShareAccepted = checked;
    if (checked) {
      this.onAcceptDataShareChange(true);
    }
  }

  private onAcceptDataShareChange(accepted: boolean): void {
    if (!accepted) return;
    this.userAcceptedDataShare = true;
    this.loadingInsuranceQuote = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.loadingInsuranceQuote = false;
      this.cdr.detectChanges();
      if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 100);
      }
    }, 1800);
  }

  onAmountInputChange(event: Event): void {
    // Manejar tanto eventos nativos como de bs-input
    const customEvent = event as CustomEvent;
    const target = event.target as any;
    let value: string;
    
    if (customEvent.detail) {
      value = customEvent.detail.value || customEvent.detail;
    } else if (target?.value !== undefined) {
      value = target.value;
    } else {
      value = (event.target as HTMLInputElement).value;
    }
    
    this.amountInputValue = value;
    const cleanValue = value.replace(/[^\d.]/g, '').replace(/\./g, '');
    
    if (cleanValue === '') {
      this.amountInputValue = '';
      this.amountError = null;
      return;
    }
    
    const numValue = parseInt(cleanValue, 10);
    
    if (isNaN(numValue)) {
      this.amountError = null;
      return;
    }
    
    if (numValue < this.minAmount || numValue > this.maxAmount) {
      this.amountError = `La cantidad debe estar entre ${this.minAmount.toLocaleString('es-ES')} € y ${this.maxAmount.toLocaleString('es-ES')} €`;
      this.amount = numValue;
    } else {
      this.amountError = null;
      this.amount = numValue;
      this.updateMonthlyPayment();
    }
    
    this.amountInputValue = numValue.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  onAmountInputFocus(): void {
    this.isInputFocused = true;
  }

  onAmountInputBlur(): void {
    this.isInputFocused = false;
    if (this.amount < this.minAmount) {
      this.amount = this.minAmount;
      this.amountError = null;
    } else if (this.amount > this.maxAmount) {
      this.amount = this.maxAmount;
      this.amountError = null;
    }
    this.amountInputValue = this.amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    this.updateMonthlyPayment();
  }

  onAmountSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.amount = value;
    this.amountInputValue = value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    this.updateMonthlyPayment();
  }

  selectTerm(months: number): void {
    this.termMonths = months;
    this.updateMonthlyPayment();
    this.cdr.detectChanges();
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }

  onInsuranceToggle(event: Event): void {
    // Si el seguro está deshabilitado, no permitir cambios
    if (this.isInsuranceDisabled) {
      event.preventDefault();
      return;
    }

    const checkbox = event.target as HTMLInputElement;
    this.hasInsurance = checkbox.checked;
    
    // Actualizar la cuota mensual inmediatamente
    this.updateMonthlyPayment();
    
    // Ya no mostramos el toast aquí: la información legal sobre el envío de datos
    // a la aseguradora está incluida en los bloques de consentimiento y texto legal.
    this.closeToast();
  }

  closeToast(): void {
    this.showToast = false;
  }

  onOpenFaq(): void {
    this.showFaqModal = true;
    this.faqActiveTab = 'prestamo';
    this.expandedPrestamoId = null;
    this.expandedSeguroId = null;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 150);
    }
  }

  onCloseFaq(): void {
    this.showFaqModal = false;
    this.expandedPrestamoId = null;
    this.expandedSeguroId = null;
  }

  setFaqTab(tab: 'prestamo' | 'seguro'): void {
    this.faqActiveTab = tab;
  }

  togglePrestamoFaq(id: number): void {
    this.expandedPrestamoId = this.expandedPrestamoId === id ? null : id;
  }

  toggleSeguroFaq(id: number): void {
    this.expandedSeguroId = this.expandedSeguroId === id ? null : id;
  }

  onFaqHelp(): void {
    this.onCloseFaq();
  }

  updateMonthlyPayment(): void {
    // Calcular la cuota mensual usando la fórmula de amortización con interés compuesto
    // Cuota = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // Donde:
    // P = Principal (amount)
    // r = Tasa de interés mensual (TIN / 12 / 100)
    // n = Número de meses (termMonths)
    
    const principal = this.amount;
    const monthlyRate = this.tin / 12 / 100; // Tasa mensual
    const numMonths = this.termMonths;
    
    if (monthlyRate === 0 || numMonths === 0) {
      // Si no hay interés o no hay plazo, dividir el principal entre los meses
      this.monthlyPayment = principal / numMonths;
    } else {
      // Fórmula de amortización
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, numMonths);
      const denominator = Math.pow(1 + monthlyRate, numMonths) - 1;
      const basePayment = principal * (numerator / denominator);
      this.monthlyPayment = basePayment;
    }
    
    // La cuota mostrada es solo la del préstamo; el seguro se cobra por separado (productos independientes)
    this.monthlyPayment = Math.round(this.monthlyPayment * 100) / 100;
    this.cdr.detectChanges();
  }

  get formattedAmount(): string {
    return this.amount.toLocaleString('es-ES');
  }

  get formattedAmountWithDecimals(): string {
    return this.amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get formattedMonthlyPayment(): string {
    return this.monthlyPayment.toFixed(2).replace('.', ',');
  }

  get minFormatted(): string {
    return this.minAmount.toLocaleString('es-ES');
  }

  get maxFormatted(): string {
    return this.maxAmount.toLocaleString('es-ES');
  }

  onNext(): void {
    if (!this.showInsuranceModule) {
      const resumenData: PrestamoCocheResumenData = {
        amount: this.amount,
        termMonths: this.termMonths,
        monthlyPayment: this.monthlyPayment,
        tin: this.tin,
        tae: this.tae,
        openingCommission: 0,
        totalInterest: this.calculateTotalInterest(),
        totalToRepay: this.calculateTotalToRepay(),
        firstPaymentDate: this.getFirstPaymentDate(),
        hasInsurance: false,
        medicalConditionDeclared: false,
        accountNumber: 'Cuenta Online Sabadell •••2930',
        accountHolder: 'María García Palao'
      };
      this.next.emit(resumenData);
      return;
    }

    // Si tiene seguro activado, mostrar modal médico primero
    if (this.hasInsurance) {
      this.showMedicalModal = true;
      document.body.style.overflow = 'hidden';
      if (typeof lucide !== 'undefined') {
        setTimeout(() => {
          lucide.createIcons();
        }, 100);
      }
    } else {
      // Si no tiene seguro, continuar directamente con los datos
      const resumenData: PrestamoCocheResumenData = {
        amount: this.amount,
        termMonths: this.termMonths,
        monthlyPayment: this.monthlyPayment,
        tin: this.tin,
        tae: this.tae,
        openingCommission: 0,
        totalInterest: this.calculateTotalInterest(),
        totalToRepay: this.calculateTotalToRepay(),
        firstPaymentDate: this.getFirstPaymentDate(),
        hasInsurance: false,
        medicalConditionDeclared: false,
        accountNumber: 'Cuenta Online Sabadell •••2930',
        accountHolder: 'María García Palao'
      };
      this.next.emit(resumenData);
    }
  }

  onConfirmNoMedicalCondition(): void {
    // Usuario confirma que no padece condición médica
    this.closeMedicalModal();
    
    // Preparar datos para el resumen
    const resumenData: PrestamoCocheResumenData = {
      amount: this.amount,
      termMonths: this.termMonths,
      monthlyPayment: this.monthlyPayment,
      tin: this.tin,
      tae: this.tae,
      openingCommission: 0, // Valor por defecto
      totalInterest: this.calculateTotalInterest(),
      totalToRepay: this.calculateTotalToRepay(),
      firstPaymentDate: this.getFirstPaymentDate(),
      hasInsurance: this.hasInsurance,
      medicalConditionDeclared: false,
      insuranceAnnualPremium: this.hasInsurance ? (this.insuranceCost * 12) : undefined,
      insuranceFirstReceipt: this.hasInsurance ? this.insuranceFirstReceipt : undefined,
      insuranceMonthlyReceipt: this.hasInsurance ? this.insuranceCost : undefined,
      accountNumber: 'Cuenta Online Sabadell •••2930',
      accountHolder: 'María García Palao'
    };
    
    // Emitir evento con los datos
    (this.next as any).emit(resumenData);
  }

  private calculateTotalInterest(): number {
    const totalPaid = this.monthlyPayment * this.termMonths;
    return totalPaid - this.amount;
  }

  private calculateTotalToRepay(): number {
    const totalInterest = this.calculateTotalInterest();
    const openingCommission = 0;
    return this.amount + totalInterest + openingCommission;
  }

  private getFirstPaymentDate(): string {
    const today = new Date();
    const firstPayment = new Date(today);
    firstPayment.setMonth(today.getMonth() + 1);
    firstPayment.setDate(30);
    return firstPayment.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  onHasMedicalCondition(): void {
    // Usuario indica que tiene o ha tenido alguna condición:
    // marcar que ha declarado condición médica, desactivar seguro y pasar al resumen sin bloque de seguro
    this.hasDeclaredMedicalCondition = true;
    this.hasInsurance = false;
    this.closeMedicalModal();
    this.updateMonthlyPayment();
    this.cdr.detectChanges();

    const resumenData: PrestamoCocheResumenData = {
      amount: this.amount,
      termMonths: this.termMonths,
      monthlyPayment: this.monthlyPayment,
      tin: this.tin,
      tae: this.tae,
      openingCommission: 0,
      totalInterest: this.calculateTotalInterest(),
      totalToRepay: this.calculateTotalToRepay(),
      firstPaymentDate: this.getFirstPaymentDate(),
      hasInsurance: false,
      medicalConditionDeclared: true,
      accountNumber: 'Cuenta Online Sabadell •••2930',
      accountHolder: 'María García Palao'
    };

    this.next.emit(resumenData);
  }

  closeMedicalModal(): void {
    this.showMedicalModal = false;
    document.body.style.overflow = '';
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  showToastNotification(message: string, type: 'info' | 'alert' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 0);
    }
    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
      this.closeToast();
    }, 5000);
  }

  openInsuranceDrawer(): void {
    this.showInsuranceDrawer = true;
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  closeInsuranceDrawer(): void {
    this.showInsuranceDrawer = false;
    document.body.style.overflow = '';
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }
}
