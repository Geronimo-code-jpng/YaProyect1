# Conexión con el sistema del negocio (deposito-ia)

El sistema de escritorio del negocio (`SistemaYa/deposito-ia`, Node + Electron + SQLite) es el **dueño del catálogo, del stock y de los pedidos**. Esta base (Neon) los muestra. Los dos lados hablan por las columnas de `productos` y `pedidos`: ese es el contrato, y vive en [`schema.ts`](./schema.ts).

- **El sistema manda:** nombre, precio del bulto (`precio`) y de la unidad (`precio_unidad`), rubro (`"Categoria"`), sub-rubro (`subcategoria`), stock (`stock_actual`, `stock_unidades`, `"Stock"`), si tiene unidad suelta (`tiene_unidad`) y si se publica (`publicado`). Y, en `pedidos`, `estado`, `sistema_*`, `carrito`/`total` si se corrigió, y los datos de pago.
- **La tienda manda:** `"Imagen"`, `mas_vendido`, `oferta_express` y `"Oferta"` (el precio tachado). El sistema nunca los toca.
- **Identificador:** `productos."Id"` es el **código del bulto** del sistema (59). La opción "Unidad" de ese producto es el suelto (59.1).

El esquema se maneja **siempre** con `schema.ts` + `drizzle-kit push`. Lo que solo agrega se empuja directo; lo que borra, recién después de publicar el código que ya no lo usa.

## Antes de empujar: la prueba en seco

```bash
pnpm db:diff                              # contra DATABASE_URL del .env (solo lee)
DRIZZLE_URL=postgresql://… pnpm db:diff   # contra una rama de prueba de Neon
```

Tiene que mostrar **solo** `CREATE TABLE`, `ADD COLUMN` y `CREATE INDEX` nuevos. Si aparece un `DROP` o un `ALTER … TYPE` que no se buscaba, no empujar: corregir `schema.ts` y repetir.

Esto es lo que muestra hoy (el push 1):

```
CREATE TABLE "productos_ids_anteriores" (…);
ALTER TABLE "productos" ADD COLUMN "stock_actual" numeric;
ALTER TABLE "productos" ADD COLUMN "stock_unidades" numeric;
ALTER TABLE "productos" ADD COLUMN "precio_unidad" bigint;
ALTER TABLE "productos" ADD COLUMN "tiene_unidad" boolean DEFAULT false NOT NULL;
ALTER TABLE "productos" ADD COLUMN "subcategoria" text;
ALTER TABLE "productos" ADD COLUMN "publicado" boolean DEFAULT true NOT NULL;
ALTER TABLE "productos" ADD COLUMN "sistema_actualizado_en" timestamp with time zone;
ALTER TABLE "pedidos" ADD COLUMN "sistema_recibido_en" timestamp with time zone;
ALTER TABLE "pedidos" ADD COLUMN "sistema_estado" text;
ALTER TABLE "pedidos" ADD COLUMN "sistema_numero" text;
ALTER TABLE "pedidos" ADD COLUMN "sistema_motivo" text;
CREATE INDEX "idx_pedidos_sin_recibir" ON "pedidos" ("id") WHERE sistema_recibido_en IS NULL;
```

> **Ojo con un falso positivo de drizzle-kit 0.31.** Al leer la base, `drizzle-kit pull` anota mal las clases de operador de los índices (por ejemplo `int8_ops` en una columna de texto). Por eso una comparación "a mano" (pull + generate) muestra un `DROP INDEX` + `CREATE INDEX` de **siete índices que ya existen y son idénticos** (`all_products`, `idx_pedidos_expira_en`, `idx_pedidos_fuente`, `idx_email_recovery_*`, `idx_carrito_actividad_*`). `pnpm db:diff` descarta esas anotaciones antes de comparar. Si al correr `pnpm db:push` drizzle pregunta por borrar y recrear esos índices, son los mismos: recrearlos no cambia nada (las tablas son chicas), pero conviene leer la lista antes de aceptar.

`schema.ts` incluye esos índices (y el nombre real `carrito_actividad_session_id_key`) justamente para que el push **no los borre**.

## Puesta en marcha, en este orden

Para no romper la tienda publicada:

1. **Push 1** (`pnpm db:push`, solo agrega: la tienda publicada no se entera) y el usuario `sistema_local` (`db/sistema_local.sql`, una sola vez, con el usuario dueño).
2. Instalar la versión nueva del sistema en el negocio.
3. En el sistema: Configuración → Página web → pegar la conexión de `sistema_local` y **Probar**. Todavía **no** activar.
4. En el sistema: Página web → Productos → **Emparejar**: decir, producto por producto, cuál es el artículo del sistema.
5. **Migrar los ids**, de noche (los carritos guardados en los navegadores con ids viejos vencen en 1 hora), primero contra una rama de Neon y después contra producción:
   ```bash
   node src/pagina/migrar-ids.js --base "<ruta>\data\deposito.db" --url "<url del dueño>"             # solo muestra
   node src/pagina/migrar-ids.js --base "<ruta>\data\deposito.db" --url "<url del dueño>" --confirmar # lo hace
   ```
   (el script está en el repo del sistema; usa el usuario **dueño**, no queda dentro del sistema).
6. **Activar** en el sistema. El primer envío pone nombres, precios, rubros y stock tal cual están allá. **Desde acá los pedidos se manejan en el sistema.**
7. **Publicar el código de esta rama** (la tienda ya tiene datos nuevos que leer).
8. **Push 2**: sacar `solo_bulto` de `schema.ts` y `pnpm db:push`. Drizzle avisa que se pierden datos: es lo esperado (ya nadie lo usa).

## Cosas que conviene saber

- **Caché:** `/api/productos` sale con `s-maxage=60`, y el navegador guarda el catálogo 1 minuto. El stock se ve con hasta ~2 minutos de atraso, no 15.
- **Productos sin publicar:** `/api/productos` no los devuelve y `/api/productos/[id]` da 404. Un producto sin stock **sí** se ve, con "SIN STOCK".
- **Pedidos:** el panel de admin de la tienda **ya no tiene botones de acción** sobre pedidos: solo los ve, con el estado que le contó el sistema. `PATCH /api/pedidos/[id]` y `POST /api/pedidos/cleanup-expired` están desactivadas (410).
- **Seguridad (aparte):** las rutas `/api/admin/*` y `PATCH /api/perfiles/[id]` siguen sin autenticación. Este trabajo cierra la edición de pedidos y de los datos de productos; el resto hay que resolverlo aparte.
