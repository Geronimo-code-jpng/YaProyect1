// Plantillas de email (HTML inline, compatible con clientes de correo).
// Se usan desde las rutas /api/** que mandan mail con Resend.

const BRAND = "#FF6600";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yamayorista.online";
const STORE_NAME = "Ya Mayorista";

const money = (n: number) =>
  "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Caja punteada con el descuento de primera compra ($1.000 OFF). */
function couponBox(): string {
  return `
    <tr>
      <td style="padding:8px 32px 8px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed ${BRAND};border-radius:14px;">
          <tr>
            <td style="padding:24px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:${BRAND};line-height:1;">$1.000 OFF</div>
              <div style="margin-top:8px;font-size:15px;color:#3f3f46;font-weight:700;">en tu primera compra</div>
              <div style="margin-top:6px;font-size:13px;color:#71717a;">
                En compras mayores a $80.000 · Válido solo para envíos a domicilio
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/** Botón principal centrado. */
function ctaButton(url: string, label: string): string {
  return `
    <tr>
      <td style="padding:24px 32px 8px 32px;text-align:center;">
        <a href="${url}" target="_blank"
           style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:14px 40px;border-radius:12px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>`;
}

/** Envoltorio comun: header naranja + contenido + footer. */
function shell(innerRows: string): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="background:${BRAND};padding:28px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:.5px;">${STORE_NAME}</span>
              </td>
            </tr>
            ${innerRows}
            <tr>
              <td style="background:#fafafa;padding:20px 32px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;text-align:center;">
                  ${STORE_NAME} · Este es un email automático.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

interface ReminderOpts {
  /** Nombre del cliente para el saludo. */
  nombre?: string | null;
  /** URL a la que lleva el botón principal. Default: la home. */
  ctaUrl?: string;
}

/**
 * Recordatorio para cuentas registradas que todavía no compraron.
 * Les recuerda el descuento de primera compra ($1.000 OFF en compras > $80.000,
 * solo envíos), que es la misma promo que se muestra en login/registro.
 */
export function reminderNoPurchaseEmail(opts: ReminderOpts = {}): {
  subject: string;
  html: string;
} {
  const nombre = (opts.nombre || "").trim();
  const saludo = nombre ? `¡Hola ${escapeHtml(nombre)}!` : "¡Hola!";
  const ctaUrl = opts.ctaUrl || SITE_URL;

  const subject = "Tenés $1.000 OFF esperándote en tu primera compra 🎁";

  const html = shell(`
    <tr>
      <td style="padding:36px 32px 8px 32px;">
        <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#18181b;">${saludo}</h1>
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#52525b;">
          Vimos que creaste tu cuenta pero todavía no hiciste tu primer pedido.
          Te dejamos un empujón: tenés un <strong>descuento exclusivo</strong> guardado
          para estrenar tu cuenta.
        </p>
      </td>
    </tr>
    ${couponBox()}
    ${ctaButton(ctaUrl, "Ver productos y comprar")}
    <tr>
      <td style="padding:8px 32px 32px 32px;">
        <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#71717a;">
          El descuento se aplica automáticamente en el carrito cuando cumplís las
          condiciones. Cualquier duda, respondé este mail y te ayudamos.
        </p>
      </td>
    </tr>`);

  return { subject, html };
}

interface AbandonedCartItem {
  nombre?: string | null;
  cantidad?: number | null;
}

interface AbandonedCartOpts {
  nombre?: string | null;
  /** Cantidad total de productos en el carrito. */
  itemCount: number;
  /** Total del carrito en pesos. */
  total: number;
  /** Ítems para la mini-lista (se muestran hasta 5). */
  items?: AbandonedCartItem[];
  /** Mostrar la caja del descuento de primera compra (solo si aplica). */
  showDiscount?: boolean;
  /** URL del botón. Default: /login. */
  ctaUrl?: string;
}

/**
 * Recordatorio para gente que dejó productos en el carrito y no terminó la compra.
 * El carrito real vive en el navegador (localStorage, TTL 1h); este mail solo
 * recuerda qué había y linkea al login para retomar. Si es la primera compra de
 * la cuenta, suma la caja del descuento.
 */
export function abandonedCartEmail(opts: AbandonedCartOpts): {
  subject: string;
  html: string;
} {
  const nombre = (opts.nombre || "").trim();
  const saludo = nombre ? `¡Hola ${escapeHtml(nombre)}!` : "¡Hola!";
  const ctaUrl = opts.ctaUrl || `${SITE_URL}/login`;
  const n = Math.max(1, Math.round(opts.itemCount || 0));

  const subject =
    n === 1
      ? "Te quedó un producto en el carrito 🛒"
      : `Te quedaron ${n} productos en el carrito 🛒`;

  const filas = (opts.items || [])
    .slice(0, 5)
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#3f3f46;">
            <strong style="color:${BRAND};">${Math.max(1, Math.round(Number(it.cantidad) || 1))}×</strong>
            ${escapeHtml((it.nombre || "Producto").toString())}
          </td>
        </tr>`,
    )
    .join("");

  const restantes = (opts.items || []).length - 5;
  const filaMas =
    restantes > 0
      ? `<tr><td style="padding:8px 0;font-size:13px;color:#a1a1aa;">y ${restantes} producto(s) más…</td></tr>`
      : "";

  const html = shell(`
    <tr>
      <td style="padding:36px 32px 8px 32px;">
        <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#18181b;">${saludo}</h1>
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#52525b;">
          Dejaste productos en tu carrito y no llegaste a terminar el pedido.
          Todavía estás a tiempo de completarlo.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 8px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:14px;">
          <tr><td style="padding:16px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${filas}
              ${filaMas}
              <tr>
                <td style="padding:12px 0 0 0;font-size:16px;font-weight:800;color:#18181b;">
                  Total: <span style="color:${BRAND};">${money(opts.total)}</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td>
    </tr>
    ${opts.showDiscount ? couponBox() : ""}
    ${ctaButton(ctaUrl, "Volver a mi carrito")}
    <tr>
      <td style="padding:8px 32px 32px 32px;">
        <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#71717a;">
          Entrá a tu cuenta y volvé a armar el pedido con estos productos.
          Cualquier duda, respondé este mail y te ayudamos.
        </p>
      </td>
    </tr>`);

  return { subject, html };
}
