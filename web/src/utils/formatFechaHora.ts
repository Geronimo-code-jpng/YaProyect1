const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

// Fecha y hora de un pedido en horario de Buenos Aires (GMT-3), sin
// segundos ni milisegundos, sin importar la zona horaria del navegador.
export function formatFechaHora(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "";
  return new Date(fechaIso).toLocaleString("es-AR", {
    timeZone: ZONA_HORARIA,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatFechaCorta(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "";
  return new Date(fechaIso).toLocaleDateString("es-AR", {
    timeZone: ZONA_HORARIA,
    day: "numeric",
    month: "short",
  });
}
