/** "$12.500" — Argentine peso formatting used across the admin panel. */
export function formatMoneda(value: number | string | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("es-AR")}`;
}
