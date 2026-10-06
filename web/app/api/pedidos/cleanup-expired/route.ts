import { jsonCors } from "@/lib/cors";

// Antes vencía los pedidos "configurado" cuyo expira_en ya pasó. Los pedidos
// ahora los maneja el sistema del negocio (deposito-ia) y la página no cambia
// su estado: esta ruta quedó sin uso y se desactiva.
export async function POST() {
  return jsonCors(
    { error: "Los pedidos los maneja el sistema del negocio: no se vencen desde la página" },
    410,
  );
}
