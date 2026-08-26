import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function POST(request: Request) {
  const body = await request.json();

  const values = {
    Id: Date.now(),
    nombre: body.nombre,
    precio: body.precio,
    Categoria: body.Categoria,
    Oferta: body.Oferta || null,
    Stock: Boolean(body.Stock),
    quantity: body.quantity || 1,
    oferta_express: Boolean(body.oferta_express),
    mas_vendido: Boolean(body.mas_vendido),
    solo_bulto: Boolean(body.solo_bulto),
    Imagen: body.Imagen || null,
  };

  const [created] = await db.insert(productos).values(values).returning();
  return jsonCors(created);
}
