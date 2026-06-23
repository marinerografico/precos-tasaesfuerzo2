import { EntryScreen, WizardState } from './services/wizard-state.service';
import {
  PrestamoFlowViewSlug,
  slugToPrestamoFlowView
} from './constants/prestamo-flow-routing';

/** Segmento de URL bajo `/app/...` coherente con el paso del wizard */
export function wizardStateToSlug(state: WizardState): string {
  if (state.currentStep === 1) {
    return state.entryScreen === 'proximos-pagos' ? 'proximos-pagos' : 'posicion-global';
  }
  const byStep: Record<number, string> = {
    2: 'contratar',
    3: 'prestamos',
    4: 'landing',
    5: 'perfil-financiero',
    6: 'capacidad-financiacion',
    7: 'recomendaciones',
    8: 'meta',
    9: 'resumen',
    10: 'gestionar-pagos'
  };
  return byStep[state.currentStep] ?? 'posicion-global';
}

/** Comandos de navegación (`/app/...`) incluyendo sub-ruta del flujo de préstamo */
export function wizardStateToNavigateCommands(state: WizardState): string[] {
  const slug = wizardStateToSlug(state);
  if (state.currentStep === 3 && state.prestamoFlowSlug) {
    return ['/app', slug, state.prestamoFlowSlug];
  }
  return ['/app', slug];
}

export function isPrestamoFlowSlug(slug: string): slug is PrestamoFlowViewSlug {
  return slugToPrestamoFlowView(slug) !== null;
}

export function slugToWizardPatch(
  slug: string
): { step: number; entryScreen?: EntryScreen } | null {
  const map: Record<string, { step: number; entryScreen?: EntryScreen }> = {
    'posicion-global': { step: 1, entryScreen: 'posicion-global' },
    'proximos-pagos': { step: 1, entryScreen: 'proximos-pagos' },
    contratar: { step: 2 },
    prestamos: { step: 3 },
    landing: { step: 4 },
    'perfil-financiero': { step: 5 },
    'capacidad-financiacion': { step: 6 },
    recomendaciones: { step: 7 },
    meta: { step: 8 },
    resumen: { step: 9 },
    'gestionar-pagos': { step: 10 }
  };
  return map[slug] ?? null;
}
