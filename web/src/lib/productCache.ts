// Claves y helpers del cache de productos en localStorage.
// Se centralizan aca para que login/admin puedan invalidarlo.

export const PRODUCT_CACHE_KEY = "ya_mayorista_products_cache";
export const PRODUCT_CACHE_TIMESTAMP_KEY = "ya_mayorista_products_timestamp";

/** Borra el cache de productos guardado en localStorage. */
export function clearProductCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PRODUCT_CACHE_KEY);
    localStorage.removeItem(PRODUCT_CACHE_TIMESTAMP_KEY);
  } catch {
    // Ignorar: localStorage puede no estar disponible
  }
}

/** True si hay una sesion activa con rol admin. */
export function isAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("userSession");
    if (!raw) return false;
    const session = JSON.parse(raw) as { isLoggedIn?: boolean; rol?: string };
    return session?.isLoggedIn === true && session?.rol === "admin";
  } catch {
    return false;
  }
}
