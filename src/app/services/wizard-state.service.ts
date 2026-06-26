import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PRECONCEDIDO_IMPORTE_MAX } from '../constants/prestamo-preconcedido-offer';
import { PrestamoFlowViewSlug } from '../constants/prestamo-flow-routing';

export interface FinancialProfile {
  ingresos: number;
  gastos: number;
  productos: Product[];
  otrosBancos: boolean;
}

export interface Product {
  id: string;
  nombre: string;
  tipo: string;
  numero?: string;
}

export interface RecommendedProduct {
  id: string;
  nombre: string;
  tipoInteres: string;
  condiciones: string;
  tipo: 'tarjeta' | 'prestamo' | 'credito';
}

export type EntryScreen = 'proximos-pagos' | 'posicion-global';
export type PosicionGlobalCardView = 'total' | 'upcoming';

/** Logos de marca (referencia Próximos pagos) */
export type UpcomingPaymentLogoVariant = 'asisa' | 'prestamos' | 'aguas' | 'telecom';

/** Movimiento previsto (Próximos pagos + pestaña Próximos en Cuentas) */
export interface UpcomingPaymentItem {
  id: string;
  name: string;
  amount: number;
  label: string;
  schedule: string;
  /** Fallback si no hay logoVariant */
  logo: string;
  logoBg: string;
  /** Logo vectorial de la referencia */
  logoVariant?: UpcomingPaymentLogoVariant;
  /** Segunda línea informativa (p. ej. número de cuota) */
  detail?: string;
  /** Texto tipo "Cuenta *4422" */
  accountMask: string;
  /** En qué cuentas del carrusel aplica; si falta, solo principal */
  accounts?: ('principal' | 'familiar')[];
}

/** Suma y recuento coherentes con la lista (evita totales desincronizados al filtrar por cuenta) */
export function aggregateUpcomingPayments(items: UpcomingPaymentItem[]): {
  total: number;
  count: number;
} {
  const total = items.reduce((sum, it) => sum + it.amount, 0);
  return { total, count: items.length };
}

/** Suscripción recurrente demo (misma fuente: Próximos pagos, Posición global, Gestionar pagos) */
export interface RecurringSubscriptionItem {
  id: string;
  merchant: string;
  lineSub?: string;
  priceMonthly: number;
  logoInitial: string;
  logoColor: string;
  logoAsset?: string;
}

export function aggregateRecurringSubscriptionsMonthly(
  subs: RecurringSubscriptionItem[]
): { total: number; count: number } {
  const total = subs.reduce((sum, s) => sum + s.priceMonthly, 0);
  return { total, count: subs.length };
}

/** Total «30 días» transversal: cargos previstos + cuotas mensuales de suscripciones */
export function combineUpcomingAndSubscriptions30d(
  items: UpcomingPaymentItem[],
  subs: RecurringSubscriptionItem[]
): { total: number; count: number } {
  const u = aggregateUpcomingPayments(items);
  const s = aggregateRecurringSubscriptionsMonthly(subs);
  return { total: u.total + s.total, count: u.count + s.count };
}

/** Lista demo de suscripciones activas (importes alineados con el hub) */
export const DEFAULT_RECURRING_SUBSCRIPTIONS: RecurringSubscriptionItem[] = [
  {
    id: 'sub-1',
    merchant: 'Netflix',
    lineSub: 'Mensual, se renueva 21 Abr',
    priceMonthly: 17.99,
    logoInitial: 'N',
    logoColor: '#E50914',
    logoAsset: 'assets/gph-logo-netflix.png'
  },
  {
    id: 'sub-3',
    merchant: 'HBO Max',
    lineSub: 'Mensual, se renueva 1 May',
    priceMonthly: 8.99,
    logoInitial: 'H',
    logoColor: '#8B5CF6',
    logoAsset: 'assets/gph-logo-hbo.png'
  }
];

/** Lista demo: total 450 € / 4 pagos; *4422 → 3 cargos (410 €); *4425 → 1 cargo (40 €) */
export const DEFAULT_UPCOMING_PAYMENTS_ITEMS: UpcomingPaymentItem[] = [
  {
    id: '1',
    name: 'Asisa Asistencia',
    amount: 100,
    label: 'Domiciliación',
    schedule: 'Previsto miércoles 15 Abr',
    logo: 'A',
    logoBg: '#0a2744',
    logoVariant: 'asisa',
    accountMask: 'Cuenta *4422',
    accounts: ['principal']
  },
  {
    id: '2',
    name: 'Préstamos Adeudo',
    detail: 'Cuota N.123456789',
    amount: 250,
    label: 'Préstamos',
    schedule: 'Previsto viernes 17 Abr',
    logo: 'P',
    logoBg: '#0095ff',
    logoVariant: 'prestamos',
    accountMask: 'Cuenta *4422',
    accounts: ['principal']
  },
  {
    id: '3',
    name: 'Aguas Barcelona',
    amount: 60,
    label: 'Domiciliación',
    schedule: 'Previsto lunes 20 Abr',
    logo: 'B',
    logoBg: '#003b73',
    logoVariant: 'aguas',
    accountMask: 'Cuenta *4422',
    accounts: ['principal', 'familiar']
  },
  {
    id: '4',
    name: 'Fibra y línea móvil',
    amount: 40,
    label: 'Domiciliación',
    schedule: 'Previsto jueves 30 Abr',
    logo: 'T',
    logoBg: '#1e3a5f',
    logoVariant: 'telecom',
    accountMask: 'Cuenta *4425',
    accounts: ['principal', 'familiar']
  }
];

export interface WizardState {
  currentStep: number;
  capacidadMaxima: number;
  capacidadMensual: number;
  plazoAnos: number;
  perfilFinanciero?: FinancialProfile;
  productosRecomendados?: RecommendedProduct[];
  metaObjetivo?: number;
  hasUpdatedPotential?: boolean;
  financialScore?: number; // 0-100
  showPrestamoModal?: boolean; // Flag para mostrar modal de préstamo
  loanCompleted?: boolean; // Flag para indicar que el préstamo fue completado
  loanAmount?: number; // Monto del préstamo completado
  /** Tras el login: primera pantalla del wizard (paso 1) */
  entryScreen?: EntryScreen;
  /** Toggle tarjeta principal en Posición global (saldo vs próximos pagos) */
  posicionGlobalCardView?: PosicionGlobalCardView;
  /** Total demo de próximos pagos (30 días), alineado con la captura */
  upcomingPaymentsTotal?: number;
  /** Número de pagos previstos en el periodo (lista Próximos pagos) */
  upcomingPaymentsCount?: number;
  /** Movimientos próximos 30 días (compartido Próximos pagos + Cuentas) */
  upcomingPaymentsItems?: UpcomingPaymentItem[];
  /** Suscripciones activas demo; incluidas en totales 30 días junto con upcoming */
  recurringSubscriptionItems?: RecurringSubscriptionItem[];
  /** Detalle de un movimiento (panel compartido) */
  selectedUpcomingPaymentId?: string | null;
  /** Abrir el hub de Gestionar pagos directamente en la lista de Suscripciones */
  gestionarPagosDirectoSuscripciones?: boolean;
  /** Si viene informado con directo suscripciones, abrir el detalle de esa suscripción (id demo del hub) */
  gestionarPagosAbrirSuscripcionId?: string | null;
  /**
   * Tras el banner verde «Préstamo Sabadell» en Posición global: al montar Préstamos, abrir ese flujo directamente.
   * Se consume al ejecutarse (no usar sessionStorage: evita carreras con la navegación).
   */
  pendientePrestamoSabadellDesdePosicion?: boolean;
  /** Sub-ruta bajo `/app/prestamos/...` (null = listado) */
  prestamoFlowSlug?: PrestamoFlowViewSlug | null;
  /** Importe máximo preconcedido ofrecido (Posición global → drawer → simulador) */
  preconcedidoImporteMax?: number;
  /** Al entrar desde Posición global / Contratar: abrir onboarding del preconcedido */
  pendientePreconcedidoOnboarding?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WizardStateService {
  private initialState: WizardState = (() => {
    const items = DEFAULT_UPCOMING_PAYMENTS_ITEMS;
    const subs = DEFAULT_RECURRING_SUBSCRIPTIONS;
    const combined = combineUpcomingAndSubscriptions30d(items, subs);
    return {
    currentStep: 1, // Posición Global
    capacidadMaxima: 18000,
    capacidadMensual: 350,
    plazoAnos: 5,
    entryScreen: 'posicion-global',
    posicionGlobalCardView: 'total',
    upcomingPaymentsTotal: combined.total,
    upcomingPaymentsCount: combined.count,
    upcomingPaymentsItems: items,
    recurringSubscriptionItems: subs,
    selectedUpcomingPaymentId: null,
    gestionarPagosDirectoSuscripciones: false,
    gestionarPagosAbrirSuscripcionId: null,
    preconcedidoImporteMax: PRECONCEDIDO_IMPORTE_MAX,
    prestamoFlowSlug: null,
    pendientePreconcedidoOnboarding: false,
    perfilFinanciero: {
      ingresos: 0,
      gastos: 0,
      productos: [],
      otrosBancos: false
    }
  };
  })();

  private stateSubject = new BehaviorSubject<WizardState>(this.initialState);
  public state$: Observable<WizardState> = this.stateSubject.asObservable();

  constructor() {
    // Inicializar con datos simulados
    this.updateProfile({
      ingresos: 3500,
      gastos: 2000,
      productos: [
        { id: '1', nombre: 'Cuenta Sabadell', tipo: 'cuenta', numero: '4422' },
        { id: '2', nombre: 'Tarjeta BS Card', tipo: 'tarjeta', numero: '7830' }
      ],
      otrosBancos: false
    });
  }

  getCurrentState(): WizardState {
    return this.stateSubject.value;
  }

  setCurrentStep(step: number): void {
    const currentState = this.getCurrentState();
    const next: WizardState = {
      ...currentState,
      currentStep: step
    };
    if (step !== 3 && currentState.pendientePrestamoSabadellDesdePosicion) {
      next.pendientePrestamoSabadellDesdePosicion = false;
    }
    if (step !== 3) {
      next.prestamoFlowSlug = null;
    }
    this.stateSubject.next(next);
  }

  applyPrestamoFlowFromUrl(slug: PrestamoFlowViewSlug | null): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentStep: 3,
      prestamoFlowSlug: slug,
      pendientePrestamoSabadellDesdePosicion: false
    });
  }

  setPrestamoFlowSlug(slug: PrestamoFlowViewSlug | null): void {
    const currentState = this.getCurrentState();
    if (currentState.currentStep !== 3) {
      return;
    }
    if (currentState.prestamoFlowSlug === slug) {
      return;
    }
    this.stateSubject.next({
      ...currentState,
      prestamoFlowSlug: slug
    });
  }

  /**
   * Banner / entry preconcedido en Posición global → Préstamos con onboarding y mismo importe máximo.
   */
  openPreconcedidoDesdePosicionGlobal(
    importeMax: number = PRECONCEDIDO_IMPORTE_MAX
  ): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentStep: 3,
      preconcedidoImporteMax: importeMax,
      pendientePreconcedidoOnboarding: true,
      prestamoFlowSlug: null,
      pendientePrestamoSabadellDesdePosicion: false
    });
  }

  clearPendientePreconcedidoOnboarding(): void {
    const currentState = this.getCurrentState();
    if (!currentState.pendientePreconcedidoOnboarding) {
      return;
    }
    this.stateSubject.next({
      ...currentState,
      pendientePreconcedidoOnboarding: false
    });
  }

  setPreconcedidoImporteMax(importeMax: number): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      preconcedidoImporteMax: importeMax
    });
  }

  /**
   * Navega al paso Préstamos y marca que debe abrirse el flujo Préstamo Sabadell (banner Posición global).
   */
  irAPrestamosSabadellDesdePosicionGlobal(): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentStep: 3,
      pendientePrestamoSabadellDesdePosicion: true
    });
  }

  /** Quita el flag tras abrir el flujo en el componente Préstamos */
  clearPendientePrestamoSabadellDesdePosicion(): void {
    const currentState = this.getCurrentState();
    if (!currentState.pendientePrestamoSabadellDesdePosicion) {
      return;
    }
    this.stateSubject.next({
      ...currentState,
      pendientePrestamoSabadellDesdePosicion: false
    });
  }

  nextStep(): void {
    const currentState = this.getCurrentState();
    // Contratar y Préstamos navegan por setCurrentStep; no deben saltar a MoneyConfidence (paso 4+).
    if (currentState.currentStep === 2 || currentState.currentStep === 3) {
      return;
    }
    if (currentState.currentStep < 9) {
      this.setCurrentStep(currentState.currentStep + 1);
    }
  }

  previousStep(): void {
    const currentState = this.getCurrentState();
    if (currentState.currentStep === 10) {
      this.setCurrentStep(1);
      return;
    }
    if (currentState.currentStep > 1) {
      this.setCurrentStep(currentState.currentStep - 1);
    }
  }

  setEntryScreen(screen: EntryScreen): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      entryScreen: screen
    });
  }

  setPosicionGlobalCardView(view: PosicionGlobalCardView): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      posicionGlobalCardView: view
    });
  }

  togglePosicionGlobalCardView(): void {
    const currentState = this.getCurrentState();
    const next: PosicionGlobalCardView =
      currentState.posicionGlobalCardView === 'upcoming' ? 'total' : 'upcoming';
    this.setPosicionGlobalCardView(next);
  }

  setSelectedUpcomingPaymentId(id: string | null): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      selectedUpcomingPaymentId: id
    });
  }

  /** Paso 10 (Gestionar pagos) abriendo la vista Suscripciones */
  goToGestionarPagosSuscripciones(): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentStep: 10,
      gestionarPagosDirectoSuscripciones: true,
      gestionarPagosAbrirSuscripcionId: null
    });
  }

  /** Paso 10: Suscripciones y detalle de una suscripción concreta (mismo id que en el hub) */
  goToGestionarPagosSuscripcionDetalle(subscriptionId: string): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentStep: 10,
      gestionarPagosDirectoSuscripciones: true,
      gestionarPagosAbrirSuscripcionId: subscriptionId
    });
  }

  /** Paso 10 con el menú principal de Gestionar pagos (no salto a Suscripciones) */
  goToGestionarPagosMenu(): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentStep: 10,
      gestionarPagosDirectoSuscripciones: false,
      gestionarPagosAbrirSuscripcionId: null
    });
  }

  clearGestionarPagosDirectoSuscripciones(): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      gestionarPagosDirectoSuscripciones: false,
      gestionarPagosAbrirSuscripcionId: null
    });
  }

  getUpcomingPaymentById(id: string): UpcomingPaymentItem | undefined {
    const items = this.getCurrentState().upcomingPaymentsItems ?? DEFAULT_UPCOMING_PAYMENTS_ITEMS;
    return items.find(i => i.id === id);
  }

  updateProfile(profile: Partial<FinancialProfile>): void {
    const currentState = this.getCurrentState();
    const updatedProfile = {
      ...currentState.perfilFinanciero,
      ...profile
    } as FinancialProfile;

    // Recalcular capacidad basada en el perfil
    const capacidad = this.calculateCapacity(updatedProfile);

    this.stateSubject.next({
      ...currentState,
      perfilFinanciero: updatedProfile,
      capacidadMaxima: capacidad.maxima,
      capacidadMensual: capacidad.mensual
    });
  }

  updateRecommendedProducts(products: RecommendedProduct[]): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      productosRecomendados: products
    });
  }

  setMetaObjetivo(meta: number): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      metaObjetivo: meta
    });
  }

  markPotentialUpdated(): void {
    const currentState = this.getCurrentState();
    // Calcular scoring basado en el perfil
    const score = this.calculateFinancialScore(currentState.perfilFinanciero);
    this.stateSubject.next({
      ...currentState,
      hasUpdatedPotential: true,
      financialScore: score
    });
  }

  setShowPrestamoModal(show: boolean): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      showPrestamoModal: show
    });
  }

  private calculateFinancialScore(profile?: FinancialProfile): number {
    if (!profile || profile.ingresos === 0) return 50; // Score por defecto
    
    const disponible = profile.ingresos - profile.gastos;
    const ratioDisponible = disponible / profile.ingresos;
    
    // Score basado en:
    // - Ratio de disponibilidad (0-60 puntos)
    // - Estabilidad (tiene productos = más estable) (0-40 puntos)
    let score = Math.min(60, ratioDisponible * 100);
    
    if (profile.productos && profile.productos.length > 0) {
      score += Math.min(40, profile.productos.length * 10);
    }
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private calculateCapacity(profile: FinancialProfile): { maxima: number; mensual: number } {
    // Simulación de cálculo de capacidad
    const disponible = profile.ingresos - profile.gastos;
    const ratio = 0.3; // 30% del disponible
    const mensual = Math.max(0, disponible * ratio);
    const maxima = mensual * 60; // 5 años = 60 meses

    return {
      maxima: Math.round(maxima),
      mensual: Math.round(mensual)
    };
  }

  markLoanCompleted(amount: number): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      loanCompleted: true,
      loanAmount: amount
    });
  }

  clearLoanCompleted(): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      loanCompleted: false,
      loanAmount: undefined
    });
  }

  reset(): void {
    this.stateSubject.next(this.initialState);
  }
}
