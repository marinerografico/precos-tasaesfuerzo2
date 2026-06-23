/** Importe máximo preconcedido mostrado en Posición global, drawer y simulador */
export const PRECONCEDIDO_IMPORTE_MIN = 3000;
export const PRECONCEDIDO_IMPORTE_MAX = 45000;

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

/** Importe inicial del simulador (~75 % del máximo, múltiplo de 500) */
export function defaultPreconcedidoSimulacionImporte(max = PRECONCEDIDO_IMPORTE_MAX): number {
  const raw = max * 0.75;
  return Math.min(max, Math.max(PRECONCEDIDO_IMPORTE_MIN, Math.round(raw / 500) * 500));
}
