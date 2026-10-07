// Recargo por pagar con transferencia: el mismo 2 % que cobra el negocio en el
// mostrador. Se calcula sobre todo el pedido (productos y envío) y viaja aparte
// en el pedido (columna `recargo`), para que el sistema lo distinga del envío.
export const RECARGO_TRANSFERENCIA = 2;

export const recargoDe = (metodoPago: string, total: number): number =>
  metodoPago === "transferencia" ? Math.round(total * RECARGO_TRANSFERENCIA) / 100 : 0;
