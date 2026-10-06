import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Solo pedidos de la tienda: los del sistema del negocio no se muestran en la web.
  const [row] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.id, Number(id)), eq(pedidos.fuente, "web")));
  return jsonCors(row ?? null);
}

// Los pedidos ya no se modifican desde la página: los acepta, rechaza, corrige
// y cobra el sistema del negocio (deposito-ia), que le cuenta a la tienda cómo
// quedó cada uno (estado, sistema_estado, sistema_numero, sistema_motivo). Dejar
// esta ruta abierta, sin autenticación, permitía que cualquiera marcara un
// pedido como pagado.
export async function PATCH() {
  return jsonCors(
    { error: "Los pedidos los maneja el sistema del negocio: no se modifican desde la página" },
    410,
  );
}
