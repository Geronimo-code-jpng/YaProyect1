-- Agregar columnas de datos bancarios a la tabla configuracion
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS banco TEXT DEFAULT '';
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS titular TEXT DEFAULT '';
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS alias TEXT DEFAULT '';
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS cbu TEXT DEFAULT '';
