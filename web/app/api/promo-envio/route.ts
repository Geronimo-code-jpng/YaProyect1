import { jsonCors } from "@/lib/cors";
import { promoEnvio } from "@/lib/promoEnvio";

// Sellos de la promo de envío gratis de una cuenta (perfil y carrito).
export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("user_id");
  return jsonCors(await promoEnvio(userId));
}
