/** Importe máximo preconcedido mostrado en Posición global, drawer y simulador */
export const PRECONCEDIDO_IMPORTE_MIN = 3000;
export const PRECONCEDIDO_IMPORTE_MAX = 45000;

/** Condiciones ilustrativas del simulador preconcedido (card Contratar, simulación, resumen) */
export const PRECONCEDIDO_TIN_ANUAL = 4;
export const PRECONCEDIDO_TAE_ANUAL = 4.84;
export const PRECONCEDIDO_PLAZO_MESES_DEFAULT = 96;

export function formatPreconcedidoImporte(
  value: number,
  options?: { decimals?: number }
): string {
  const decimals = options?.decimals ?? 0;
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPreconcedidoTaeLabel(): string {
  return `${PRECONCEDIDO_TAE_ANUAL.toFixed(2).replace('.', ',')}% TAE`;
}

export function formatPreconcedidoPlazoLabel(
  months = PRECONCEDIDO_PLAZO_MESES_DEFAULT
): string {
  const years = months / 12;
  return Number.isInteger(years) ? `${years} años` : `${months} meses`;
}

/** Importe inicial del simulador (~75 % del máximo, múltiplo de 500) */
export function defaultPreconcedidoSimulacionImporte(max = PRECONCEDIDO_IMPORTE_MAX): number {
  const raw = max * 0.75;
  return Math.min(max, Math.max(PRECONCEDIDO_IMPORTE_MIN, Math.round(raw / 500) * 500));
}
