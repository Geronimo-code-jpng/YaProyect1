// Decoración de Navidad: se prende sola del 1 de diciembre al 6 de enero (Reyes).
// NEXT_PUBLIC_NAVIDAD=1 la fuerza prendida (para verla antes) y =0 apagada.
export function esNavidad(fecha = new Date()): boolean {
  const forzada = process.env.NEXT_PUBLIC_NAVIDAD;
  if (forzada === "1") return true;
  if (forzada === "0") return false;
  const mes = fecha.getMonth(); // 0 = enero, 11 = diciembre
  return mes === 11 || (mes === 0 && fecha.getDate() <= 6);
}
