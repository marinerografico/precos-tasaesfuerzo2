export type PrestamoFlowViewSlug =
  | 'onboarding'
  | 'simulacion'
  | 'resumen'
  | 'normativa'
  | 'normativa-no-disponible'
  | 'documentacion-carga'
  | 'documentacion'
  | 'firma'
  | 'seguro-carga'
  | 'seguro-documentacion'
  | 'seguro-firma'
  | 'confirmacion-carga'
  | 'confirmacion'
  | 'sabadell';

export type PrestamoCocheInternalView =
  | 'none'
  | 'sabadell-flow'
  | 'simulation'
  | 'resumen'
  | 'normativa'
  | 'normativa-unavailable'
  | 'document-loading'
  | 'document-manager'
  | 'firma'
  | 'seguro-loading'
  | 'seguro-document-manager'
  | 'seguro-firma'
  | 'final-loading'
  | 'confirmacion';

export interface PrestamoFlowRoutePatch {
  view: PrestamoCocheInternalView;
  showOnboarding?: boolean;
}

const VIEW_TO_SLUG: Record<Exclude<PrestamoCocheInternalView, 'none' | 'simulation'>, PrestamoFlowViewSlug> = {
  'sabadell-flow': 'sabadell',
  resumen: 'resumen',
  normativa: 'normativa',
  'normativa-unavailable': 'normativa-no-disponible',
  'document-loading': 'documentacion-carga',
  'document-manager': 'documentacion',
  firma: 'firma',
  'seguro-loading': 'seguro-carga',
  'seguro-document-manager': 'seguro-documentacion',
  'seguro-firma': 'seguro-firma',
  'final-loading': 'confirmacion-carga',
  confirmacion: 'confirmacion'
};

export function prestamoFlowViewToSlug(
  view: PrestamoCocheInternalView,
  showOnboarding: boolean
): PrestamoFlowViewSlug | null {
  if (view === 'none') {
    return null;
  }
  if (view === 'simulation') {
    return showOnboarding ? 'onboarding' : 'simulacion';
  }
  return VIEW_TO_SLUG[view];
}

export function slugToPrestamoFlowView(slug: string): PrestamoFlowRoutePatch | null {
  switch (slug) {
    case 'onboarding':
      return { view: 'simulation', showOnboarding: true };
    case 'simulacion':
      return { view: 'simulation', showOnboarding: false };
    case 'sabadell':
      return { view: 'sabadell-flow' };
    case 'resumen':
      return { view: 'resumen' };
    case 'normativa':
      return { view: 'normativa' };
    case 'normativa-calculadora':
      return { view: 'normativa' };
    case 'normativa-no-disponible':
      return { view: 'normativa-unavailable' };
    case 'documentacion-carga':
      return { view: 'document-loading' };
    case 'documentacion':
      return { view: 'document-manager' };
    case 'firma':
      return { view: 'firma' };
    case 'seguro-carga':
      return { view: 'seguro-loading' };
    case 'seguro-documentacion':
      return { view: 'seguro-document-manager' };
    case 'seguro-firma':
      return { view: 'seguro-firma' };
    case 'confirmacion-carga':
      return { view: 'final-loading' };
    case 'confirmacion':
      return { view: 'confirmacion' };
    default:
      return null;
  }
}
