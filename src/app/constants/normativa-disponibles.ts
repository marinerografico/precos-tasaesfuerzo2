import { formatPreconcedidoImporte } from './prestamo-preconcedido-offer';

export type NormativaVariant = 'classic' | 'tangible';

/** Ingresos por defecto del perfil simulado (Laura, renta media) */
export const NORMATIVA_INGRESOS_DEFAULT = 3500;

/** Cuota externa de ejemplo para la tooltip (menor que X en escenarios típicos) */
export const NORMATIVA_EJEMPLO_CUOTAS_EXTERNAS = 300;

export function calcularDisponiblesNormativa(
  ingresosMensuales: number,
  cuotaPrestamo: number
): number {
  const ingresos = Math.max(0, ingresosMensuales);
  const cuota = Math.max(0, cuotaPrestamo);
  return Math.max(0, ingresos - cuota);
}

export function formatNormativaEuro(value: number): string {
  return formatPreconcedidoImporte(value);
}

export interface NormativaEjemploTooltip {
  ingresosLabel: string;
  cuotaPrestamoLabel: string;
  disponiblesLabel: string;
  cuotasExternasEjemploLabel: string;
  trasExternasLabel: string;
  puedeResponderSi: boolean;
}

export function buildNormativaEjemploTooltip(
  ingresosMensuales: number,
  cuotaPrestamo: number,
  cuotasExternasEjemplo = NORMATIVA_EJEMPLO_CUOTAS_EXTERNAS
): NormativaEjemploTooltip {
  const ingresos = ingresosMensuales > 0 ? ingresosMensuales : NORMATIVA_INGRESOS_DEFAULT;
  const cuota = Math.max(0, cuotaPrestamo);
  const disponibles = calcularDisponiblesNormativa(ingresos, cuota);
  const trasExternas = Math.max(0, ingresos - cuotasExternasEjemplo);

  return {
    ingresosLabel: formatNormativaEuro(ingresos),
    cuotaPrestamoLabel: formatNormativaEuro(cuota),
    disponiblesLabel: formatNormativaEuro(disponibles),
    cuotasExternasEjemploLabel: formatNormativaEuro(cuotasExternasEjemplo),
    trasExternasLabel: formatNormativaEuro(trasExternas),
    puedeResponderSi: trasExternas > disponibles
  };
}
