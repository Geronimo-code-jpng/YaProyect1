-- Migración: la dirección de entrega se confirma en el mapa.
-- Correr una vez contra la base de Neon (idempotente):
--   psql "$DATABASE_URL" -f web/db/migrations/0002_direccion_con_mapa.sql
-- o pegar en el SQL editor de Neon.
--
-- `direccion` sigue siendo el texto de siempre (lo lee el sistema del negocio).
-- Se suma el punto exacto que el cliente marcó y una referencia libre
-- ("portón verde"). Todo opcional: los pedidos viejos quedan como están.

ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS referencia text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lon double precision;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS referencia text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lon double precision;
