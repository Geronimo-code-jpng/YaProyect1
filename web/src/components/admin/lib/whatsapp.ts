import { parseCarrito, lineTotal, type OrderItem } from "./carrito";
import { formatMoneda } from "./format";

export const WA_COUNTRY_CODE = "549"; // Argentina + mobile prefix
export const PAY_WINDOW_MINUTES = 15;

interface OrderLike {
  id: number | string;
  nombre_cliente?: string;
  telefono?: string;
  carrito?: unknown;
  total?: number | string;
  metodo?: string;
  metodo_pago?: string;
}

export interface PriceChangeLike {
  nombre: string;
  cambios: { campo: string; valorViejo: unknown; valorNuevo: unknown }[];
}

function normalizePhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  return digits;
}

/** Build the wa.me URL, or `null` when the order has no usable phone. */
export function waUrl(phone: string | undefined, message: string): string | null {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  return `https://wa.me/${WA_COUNTRY_CODE}${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Navigate a window that was opened synchronously on the click
 * (`window.open("", "_blank")`) — avoids the pop-up blocker that fires when
 * `window.open` runs after an `await`. Returns whether a message was sent.
 */
export function openWhatsApp(
  win: Window | null,
  phone: string | undefined,
  message: string,
): boolean {
  const url = waUrl(phone, message);
  if (!url) {
    win?.close();
    return false;
  }
  if (win) win.location.href = url;
  else window.open(url, "_blank");
  return true;
}

function productosTexto(items: OrderItem[]): string {
  const activos = items.filter((i) => i.cantidad > 0);
  const lines = activos
    .slice(0, 5)
    .map((i) => `*${i.nombre}* x${i.cantidad}`)
    .join("\n");
  const extra = activos.length > 5 ? `\n*Y ${activos.length - 5} productos más*` : "";
  return lines + extra;
}

export function buildConfiguracionMessage(opts: {
  order: OrderLike;
  subtotal: number;
  envio: number;
  alias?: string;
  priceChanges?: PriceChangeLike[];
}): string {
  const { order, subtotal, envio, alias, priceChanges = [] } = opts;
  const items = parseCarrito(order.carrito);
  const total = subtotal + envio;
  const esRetiro = order.metodo === "retiro";

  let cambiosTexto = "";
  if (priceChanges.length > 0) {
    const detalle = priceChanges
      .map((ch) => {
        const precio = ch.cambios.find((c) => c.campo === "precio");
        return precio
          ? `- ${ch.nombre}: ${precio.valorViejo} → ${precio.valorNuevo}`
          : `- ${ch.nombre}: ${ch.cambios
              .map((c) => `${c.campo} ${c.valorViejo} → ${c.valorNuevo}`)
              .join(", ")}`;
      })
      .join("\n");
    cambiosTexto =
      `\n━━━ *ACTUALIZACIÓN DE PRECIOS* ━━━\n\n` +
      `*Se actualizaron los siguientes productos:*\n${detalle}\n\n` +
      `*Responde este mensaje* para confirmar los cambios o contáctanos si tienes dudas.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  const instruccionesPago =
    order.metodo_pago === "transferencia"
      ? `*Paga por transferencia bancaria al alias:* ${alias || "consultar"}\n`
      : `*Pagas en efectivo al ${esRetiro ? "retirar" : "recibir"} el pedido*\n`;

  return (
    `*¡TU PEDIDO ESTÁ LISTO!*\n\n` +
    `*Pedido #${order.id}*\n` +
    `*Cliente:* ${order.nombre_cliente ?? ""}\n\n` +
    `*Tus productos:*\n${productosTexto(items)}\n\n` +
    `*Subtotal:* ${formatMoneda(subtotal)}\n` +
    (envio > 0 ? `*Envío:* ${formatMoneda(envio)}\n` : `*Retiro en sucursal*\n`) +
    `*Total a pagar:* ${formatMoneda(total)}\n\n` +
    `*Método de entrega:* ${esRetiro ? "Retiro en sucursal" : "Envío a domicilio"}\n\n` +
    (order.metodo_pago !== "efectivo"
      ? `*Tienes ${PAY_WINDOW_MINUTES} minutos para completar el pago*\n`
      : "") +
    instruccionesPago +
    cambiosTexto +
    `*¡Gracias por tu compra!*\n` +
    `*Te mantendremos informado del estado de tu pedido*`
  );
}

export function buildRechazoMessage(opts: {
  order: OrderLike;
  motivo: string;
}): string {
  const { order, motivo } = opts;
  return (
    `❌ *TU PEDIDO HA SIDO RECHAZADO*\n\n` +
    `📦 *Pedido #${order.id}*\n` +
    `👤 *Cliente:* ${order.nombre_cliente ?? ""}\n\n` +
    `⚠️ *Lamentamos informarte que tu pedido no ha sido aprobado.*\n\n` +
    (motivo ? `📝 *Razón del rechazo:*\n${motivo}\n\n` : "") +
    `❓ *¿Tienes dudas?* Contáctanos para más información.`
  );
}

export function buildPagoConfirmadoMessage(opts: { order: OrderLike }): string {
  const { order } = opts;
  const items = parseCarrito(order.carrito);
  const lista = items
    .map((i) => `• ${i.nombre} x${i.cantidad} = ${formatMoneda(lineTotal(i))}`)
    .join("\n");
  return (
    `✅ *TU PEDIDO HA SIDO CONFIRMADO*\n\n` +
    `📦 *Pedido #${order.id}*\n` +
    `👤 *Cliente:* ${order.nombre_cliente ?? ""}\n\n` +
    `🛒 *Tus productos:*\n${lista}\n\n` +
    `💰 *Total:* ${formatMoneda(order.total)}\n\n` +
    `🎉 *¡Gracias por tu compra!*\n` +
    `📦 Te actualizaremos por este medio el estado de tu pedido\n` +
    `🚀 Tu pedido está siendo preparado para envío`
  );
}
