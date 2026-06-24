import { formatPreconcedidoImporte } from './prestamo-preconcedido-offer';

export type NormativaVariant = 'classic' | 'tangible';

/** Ingresos de referencia en el ejemplo (perfil dosmileurista) */
export const NORMATIVA_INGRESOS_EJEMPLO = 2000;

/** Cuota externa de ejemplo en la tooltip */
export const NORMATIVA_EJEMPLO_CUOTAS_EXTERNAS = 200;

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

/** Texto narrativo del ejemplo para la tooltip */
export function buildNormativaEjemploNarrativa(cuotaPrestamo: number): string {
  const ejemplo = buildNormativaEjemploTooltip(cuotaPrestamo);

  if (ejemplo.puedeResponderSi) {
    return (
      `Imagina que cobras ${ejemplo.ingresosLabel} € al mes y la cuota de este préstamo es de ${ejemplo.cuotaPrestamoLabel} €. ` +
      `En ese caso te quedarían ${ejemplo.disponiblesLabel} € disponibles. ` +
      `Si además pagas ${ejemplo.cuotasExternasEjemploLabel} € en otras entidades, después de esas cuotas te quedan ${ejemplo.trasExternasLabel} €, ` +
      `por lo que podrías responder Sí. Haz el mismo cálculo con tus ingresos y cuotas reales antes de contestar.`
    );
  }

  return (
    `Imagina que cobras ${ejemplo.ingresosLabel} € al mes y la cuota de este préstamo es de ${ejemplo.cuotaPrestamoLabel} €. ` +
    `Te quedarían ${ejemplo.disponiblesLabel} € disponibles. ` +
    `Si pagas ${ejemplo.cuotasExternasEjemploLabel} € en otras entidades, después de esas cuotas te quedan ${ejemplo.trasExternasLabel} €, ` +
    `por debajo de ese margen, así que deberías responder No. Adapta el ejemplo a tu situación real.`
  );
}

/** Ejemplo fijo dosmileurista; el usuario aplica la misma lógica con sus datos reales */
export function buildNormativaEjemploTooltip(
  cuotaPrestamo: number,
  cuotasExternasEjemplo = NORMATIVA_EJEMPLO_CUOTAS_EXTERNAS
): NormativaEjemploTooltip {
  const ingresos = NORMATIVA_INGRESOS_EJEMPLO;
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
