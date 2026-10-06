-- ===========================================================================
--  Usuario propio del sistema del negocio (deposito-ia)
--
--  El sistema de escritorio se conecta a esta base por HTTPS con ESTE usuario,
--  no con el del dueño: tiene permisos por columna y nada más. La clave del
--  dueño nunca entra al sistema, y si alguien se llevara la clave de
--  sistema_local, lo peor que puede hacer es tocar lo que el sistema ya toca.
--
--  Drizzle no maneja permisos: esto se corre UNA vez, a mano, con el usuario
--  DUEÑO de la base (por ejemplo desde el SQL Editor de Neon), DESPUÉS del
--  push 1 (las columnas tienen que existir antes de poder darles permiso).
--
--  1. Reemplazar <CLAVE LARGA> por una clave larga y aleatoria. Neon exige 60
--     bits de entropía o más:  openssl rand -base64 36
--  2. Correr el script.
--  3. La conexión que se pega en el sistema (Configuración → Página web) es:
--       postgresql://sistema_local:<CLAVE>@<mismo host que DATABASE_URL>/neondb?sslmode=require
--
--  Un rol creado POR SQL no entra en neon_superuser; uno creado desde la consola
--  de Neon sí, y tendría acceso a todo. Por eso se crea acá y no desde la consola.
--
--  La lista de columnas es la misma que usa la prueba del sistema ("Probar" en
--  Configuración → Página web): si falta un permiso, ahí dice cuál.
-- ===========================================================================

CREATE ROLE sistema_local WITH LOGIN PASSWORD '<CLAVE LARGA>';

GRANT USAGE ON SCHEMA public TO sistema_local;

-- Leer: el control general compara lo que hay con lo que debería haber, y el
-- lector trae los pedidos nuevos.
GRANT SELECT ON productos, pedidos TO sistema_local;

-- Productos: lo que manda el sistema. NUNCA "Imagen", mas_vendido,
-- oferta_express ni "Oferta": esas son de la tienda.
GRANT INSERT ("Id", nombre, precio, precio_unidad, quantity, tiene_unidad, "Categoria", subcategoria,
              stock_actual, stock_unidades, "Stock", publicado, sistema_actualizado_en)
  ON productos TO sistema_local;
GRANT UPDATE (nombre, precio, precio_unidad, quantity, tiene_unidad, "Categoria", subcategoria,
              stock_actual, stock_unidades, "Stock", publicado, sistema_actualizado_en)
  ON productos TO sistema_local;

-- Pedidos: lo que el sistema hace con cada uno (los acepta, los rechaza, los
-- cobra). No puede crear ni borrar pedidos.
GRANT UPDATE (estado, carrito, total, fecha_pago, pagado_manualmente, fecha_modificacion, modificado_por,
              sistema_recibido_en, sistema_estado, sistema_numero, sistema_motivo)
  ON pedidos TO sistema_local;

-- INSERT … ON CONFLICT DO UPDATE necesita INSERT en las columnas que inserta,
-- UPDATE en las que actualiza y SELECT en la columna del conflicto ("Id"): está
-- todo cubierto arriba.
