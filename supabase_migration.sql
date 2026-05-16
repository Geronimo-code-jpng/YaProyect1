-- ============================================
-- MIGRACIÓN: Agregar columnas para ofertas express y más vendidos
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS oferta_express BOOLEAN DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS mas_vendido BOOLEAN DEFAULT false;

-- También asegurar que la columna quantity existe
ALTER TABLE productos ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Verificar
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
