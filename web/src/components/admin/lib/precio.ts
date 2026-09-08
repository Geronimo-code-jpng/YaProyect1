/**
 * Per-unit price derived from a bundle price: +20% margin, rounded up to the
 * nearest $10. Same rule used by `web/src/utils/validateCartItems.ts`.
 */
export function unitPriceFromBundle(
  bundlePrice: number,
  qtyPerBundle: number,
): number {
  const q = qtyPerBundle || 1;
  return Math.ceil(((Number(bundlePrice) / q) * 1.2) / 10) * 10;
}
