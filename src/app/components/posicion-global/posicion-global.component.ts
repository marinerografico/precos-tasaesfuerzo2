import { Component, EventEmitter, Output, AfterViewInit, OnDestroy, ChangeDetectorRef, OnInit } from '@angular/core';
import {
  WizardStateService,
  UpcomingPaymentItem,
  DEFAULT_UPCOMING_PAYMENTS_ITEMS,
  DEFAULT_RECURRING_SUBSCRIPTIONS,
  RecurringSubscriptionItem,
  combineUpcomingAndSubscriptions30d
} from '../../services/wizard-state.service';

import { isPreconcedidoEntryBlocked } from '../../constants/prestamo-preconcedido-entry';
import {
  formatPreconcedidoImporte,
  PRECONCEDIDO_IMPORTE_MAX
} from '../../constants/prestamo-preconcedido-offer';

declare var lucide: any;

const INITIAL_30D_COMBINED = combineUpcomingAndSubscriptions30d(
  DEFAULT_UPCOMING_PAYMENTS_ITEMS,
  DEFAULT_RECURRING_SUBSCRIPTIONS
);

@Component({
  selector: 'app-posicion-global',
  templateUrl: './posicion-global.component.html',
  styleUrls: ['./posicion-global.component.scss']
})
export class PosicionGlobalComponent implements AfterViewInit, OnDestroy, OnInit {
  readonly preconcedidoImporteMaxLabel = formatPreconcedidoImporte(PRECONCEDIDO_IMPORTE_MAX);

  @Output() next = new EventEmitter<void>();
  @Output() goToPotencialFinanciero = new EventEmitter<void>();
  private iconsInitialized = false;

  // Vista interna: dashboard general o detalle de cuentas
  view: 'dashboard' | 'accounts' = 'dashboard';
  selectedAccount: 'principal' | 'familiar' = 'principal';

  // Saldos base: 400,00 € total entre cuentas (demo)
  private readonly saldoCuentaPrincipalBase = 320;
  private readonly saldoCuentaFamiliarBase = 80;

  /** Ahorro/inversión mostrado en la tarjeta de resumen */
  readonly ahorradoInvertido = 220;

  saldoCuentaPrincipal = this.saldoCuentaPrincipalBase;
  saldoCuentaFamiliar = this.saldoCuentaFamiliarBase;
  saldoTotal = this.saldoCuentaPrincipalBase + this.saldoCuentaFamiliarBase;

  // Movimiento del préstamo completado
  showLoanMovement = false;
  lastLoanAmount: number | null = null;

  upcomingPaymentsTotal = INITIAL_30D_COMBINED.total;
  /** Alineado con la lista de Próximos pagos (wizard state) */
  upcomingPaymentsCount = INITIAL_30D_COMBINED.count;
  upcomingPaymentsItems: UpcomingPaymentItem[] = [...DEFAULT_UPCOMING_PAYMENTS_ITEMS];
  /** Suscripciones demo — mismos importes que Próximos pagos / wizard */
  recurringSubscriptionItems: RecurringSubscriptionItem[] = [...DEFAULT_RECURRING_SUBSCRIPTIONS];

  /** Pestaña movimientos en vista Cuentas */
  accountsMovementTab: 'todos' | 'proximos' = 'todos';

  /** Saldo total en Inicio: siempre con ,00 */
  get saldoTotalFormatted(): string {
    return new Intl.NumberFormat('es-ES', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.saldoTotal);
  }

  get saldoCuentaPrincipalFormatted(): string {
    return this.saldoCuentaPrincipal.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get saldoCuentaFamiliarFormatted(): string {
    return this.saldoCuentaFamiliar.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get ahorradoInvertidoFormatted(): string {
    return this.ahorradoInvertido.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get lastLoanAmountFormatted(): string {
    if (!this.lastLoanAmount) {
      return '0,00';
    }
    return this.lastLoanAmount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /** Suma solo cargos «próximos» (lista movimientos), sin suscripciones */
  get upcomingPaymentsSumAll(): number {
    return this.upcomingPaymentsItems.reduce((s, it) => s + it.amount, 0);
  }

  get recurringSubscriptionsMonthlySum(): number {
    return this.recurringSubscriptionItems.reduce((s, r) => s + r.priceMonthly, 0);
  }

  /** Total 30 días transversal (Próximos pagos + suscripciones), coherente con `displaySummaryTotal` */
  get combined30DayTotal(): number {
    return this.upcomingPaymentsSumAll + this.recurringSubscriptionsMonthlySum;
  }

  /** Importe de próximos pagos con signo negativo (p. ej. -476,98) */
  get upcomingTotalFormatted(): string {
    const n = -Math.abs(this.combined30DayTotal);
    return n.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /** Total como cargo (signo negativo), coherente con la captura de resumen */
  get upcomingOutflowFormatted(): string {
    const n = Math.abs(this.combined30DayTotal);
    return (
      '-' +
      n.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) +
      ' €'
    );
  }

  get upcomingPaymentsCountLabel(): string {
    const c = this.upcomingPaymentsItems.length;
    return c === 1 ? '1 pago' : `${c} pagos`;
  }

  /** Total para la cuenta del carrusel (misma regla que Próximos pagos al filtrar) */
  get upcomingFilteredTotal(): number {
    return this.upcomingItemsForSelectedAccount.reduce((s, it) => s + it.amount, 0);
  }

  /** Previsión cuenta + suscripciones (misma lógica que resumen Próximos pagos con chip) */
  get upcomingFilteredTotalWithSubs(): number {
    return this.upcomingFilteredTotal + this.recurringSubscriptionsMonthlySum;
  }

  get upcomingFilteredCountLabel(): string {
    const c = this.upcomingItemsForSelectedAccount.length;
    return c === 1 ? '1 pago' : `${c} pagos`;
  }

  get upcomingFilteredCountWithSubsLabel(): string {
    const c = this.upcomingItemsForSelectedAccount.length + this.recurringSubscriptionItems.length;
    return c === 1 ? '1 pago' : `${c} pagos`;
  }

  /** Próximos movimientos filtrados por cuenta del carrusel */
  get upcomingItemsForSelectedAccount(): UpcomingPaymentItem[] {
    return this.upcomingPaymentsItems.filter(it => {
      const a = it.accounts;
      if (!a?.length) {
        return this.selectedAccount === 'principal';
      }
      return a.includes(this.selectedAccount);
    });
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private wizardState: WizardStateService
  ) {}

  ngAfterViewInit(): void {
    // Inicializar iconos de Lucide después de que la vista se renderice
    this.initializeIcons();
  }

  ngOnInit(): void {
    // Escuchar cambios para reflejar el préstamo completado en las cuentas
    this.wizardState.state$.subscribe(state => {
      const loanAmount = state.loanCompleted && state.loanAmount ? state.loanAmount : 0;

      this.saldoCuentaPrincipal = this.saldoCuentaPrincipalBase + loanAmount;
      this.saldoCuentaFamiliar = this.saldoCuentaFamiliarBase;
      this.saldoTotal = this.saldoCuentaPrincipal + this.saldoCuentaFamiliar;

      this.showLoanMovement = !!state.loanCompleted && !!state.loanAmount;
      this.lastLoanAmount = state.loanAmount ?? null;

      if (state.recurringSubscriptionItems?.length) {
        this.recurringSubscriptionItems = [...state.recurringSubscriptionItems];
      }
      if (state.upcomingPaymentsItems?.length) {
        this.upcomingPaymentsItems = [...state.upcomingPaymentsItems];
        const combined = combineUpcomingAndSubscriptions30d(
          this.upcomingPaymentsItems,
          this.recurringSubscriptionItems
        );
        this.upcomingPaymentsTotal = combined.total;
        this.upcomingPaymentsCount = combined.count;
      } else {
        if (state.upcomingPaymentsTotal != null) {
          this.upcomingPaymentsTotal = state.upcomingPaymentsTotal;
        }
        if (state.upcomingPaymentsCount != null) {
          this.upcomingPaymentsCount = state.upcomingPaymentsCount;
        }
      }

      this.cdr.markForCheck();
      setTimeout(() => this.initializeIcons(), 80);
    });

    // Si venimos desde la confirmación de préstamo con "Ver ingreso en la cuenta",
    // abrir directamente la vista de cuentas de la cuenta principal
    const openAccounts = sessionStorage.getItem('open-accounts-from-loan');
    if (openAccounts === 'true') {
      sessionStorage.removeItem('open-accounts-from-loan');
      this.view = 'accounts';
      this.selectedAccount = 'principal';
    }
  }

  ngOnDestroy(): void {
    // Limpiar iconos si es necesario
    if (typeof lucide !== 'undefined' && lucide.destroyIcons) {
      lucide.destroyIcons();
    }
  }

  private initializeIcons(): void {
    if (typeof lucide !== 'undefined') {
      // Esperar a que Angular termine de renderizar
      setTimeout(() => {
        try {
          // Limpiar iconos existentes si hay
          const existingIcons = document.querySelectorAll('[data-lucide] svg');
          existingIcons.forEach(svg => {
            if (svg.parentElement && svg.parentElement.tagName === 'I') {
              svg.remove();
            }
          });
          
          // Crear nuevos iconos
          lucide.createIcons();
          this.iconsInitialized = true;
          this.cdr.detectChanges();
        } catch (error) {
          console.warn('Error initializing Lucide icons:', error);
        }
      }, 200);
    }
  }

  onIrAContratar(): void {
    this.next.emit();
  }

  // Navegar a la posición de cuentas desde las filas de Cuenta Sabadell / Cuenta familiar
  onVerPosicionCuentaPrincipal(): void {
    this.view = 'accounts';
    this.selectedAccount = 'principal';
    this.initializeIcons();
    this.cdr.markForCheck();
  }

  onVerPosicionCuentaFamiliar(): void {
    this.view = 'accounts';
    this.selectedAccount = 'familiar';
    this.initializeIcons();
    this.cdr.markForCheck();
  }

  onVolverDesdePosicionCuentas(): void {
    this.view = 'dashboard';
    this.accountsMovementTab = 'todos';
    this.initializeIcons();
    this.cdr.markForCheck();
  }

  selectAccount(type: 'principal' | 'familiar'): void {
    if (this.selectedAccount !== type) {
      this.selectedAccount = type;
      this.initializeIcons();
      this.cdr.markForCheck();
    }
  }

  onAccountsCarouselScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) {
      return;
    }

    const scrollLeft = target.scrollLeft;
    const maxScroll = target.scrollWidth - target.clientWidth;

    if (maxScroll <= 0) {
      return;
    }

    const ratio = scrollLeft / maxScroll;
    const newSelected: 'principal' | 'familiar' = ratio > 0.5 ? 'familiar' : 'principal';

    if (newSelected !== this.selectedAccount) {
      this.selectedAccount = newSelected;
      this.cdr.markForCheck();
    }
  }

  onIrAPotencialFinanciero(): void {
    // Navegación inteligente: si ya tiene scoring, ir al resultado (paso 6), sino al guide panel (paso 4)
    const state = this.wizardState.getCurrentState();
    if (state.hasUpdatedPotential) {
      this.wizardState.setCurrentStep(6); // Resultado directo
    } else {
      this.wizardState.setCurrentStep(4); // Guide panel
    }
  }

  onVolverInicio(): void {
    // Volver al inicio (paso 1)
    // En este caso ya estamos en el inicio, pero podría navegar a otra sección
  }

  get showPreconcedidoEntryBanner(): boolean {
    return !isPreconcedidoEntryBlocked();
  }

  /** Banner sustituto (Préstamo Online Sabadell) cuando no aplica el entry del preconcedido */
  get showSabadellEntryBanner(): boolean {
    return isPreconcedidoEntryBlocked();
  }

  onIrAPrestamoPreconcedido(): void {
    if (isPreconcedidoEntryBlocked()) {
      return;
    }
    this.wizardState.openPreconcedidoDesdePosicionGlobal(PRECONCEDIDO_IMPORTE_MAX);
  }

  onIrAPrestamoSabadellDesdePosicion(): void {
    this.wizardState.irAPrestamosSabadellDesdePosicionGlobal();
  }

  setAccountsMovementTab(tab: 'todos' | 'proximos'): void {
    this.accountsMovementTab = tab;
    this.cdr.markForCheck();
    setTimeout(() => this.initializeIcons(), 80);
  }

  openUpcomingPaymentDetail(id: string): void {
    this.wizardState.setSelectedUpcomingPaymentId(id);
  }

  formatUpcomingAmount(n: number): string {
    return n.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
