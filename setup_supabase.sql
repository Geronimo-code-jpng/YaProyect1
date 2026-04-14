-- ============================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE PARA IMÁGENES
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================

-- 1. Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  Id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre text NOT NULL,
  precio float8 NOT NULL,
  Categoria text NOT NULL,
  Oferta text,
  Stock boolean DEFAULT false,
  Imagen text
);

-- 2. Habilitar Row Level Security
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para la tabla productos
-- Política de lectura para todos
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON productos
FOR SELECT USING (true);

-- Política de inserción para autenticados
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON productos
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización para autenticados
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON productos
FOR UPDATE USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Crear bucket de Storage (MANUAL)
-- IMPORTANTE: Debes crear el bucket manualmente en la UI de Supabase
-- 1. Ve a Storage > Create a new bucket
-- 2. Name: product-images
-- 3. Public bucket: MARCAR
-- 4. File size limit: 5MB
-- 5. Save

-- 5. Crear políticas para Storage (ejecutar después de crear el bucket)
-- Política de lectura pública para el bucket product-images
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Política de inserción para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Política de actualización para autenticados (sobrescribir imágenes)
CREATE POLICY IF NOT EXISTS "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Política de eliminación para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');

-- 6. Insertar datos de prueba (solo si la tabla está vacía)
INSERT INTO productos (nombre, precio, Categoria, Oferta, Stock)
SELECT 
  'YERBA SINCERIDAD x10U 500g', 3500, 'YERBA', '', true
WHERE NOT EXISTS (SELECT 1 FROM productos LIMIT 1);

INSERT INTO productos (nombre, precio, Categoria, Oferta, Stock)
SELECT 
  'AZUCAR RRR x10U 500g', 9300, 'ACEITE', '500', true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'AZUCAR RRR x10U 500g');

INSERT INTO productos (nombre, precio, Categoria, Oferta, Stock)
SELECT 
  'FIDEOS MOLTO x12 500g', 1200, 'ALIMENTO', '', true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'FIDEOS MOLTO x12 500g');

INSERT INTO productos (nombre, precio, Categoria, Oferta, Stock)
SELECT 
  'ACEITE COZINAR 900ml', 4500, 'ACEITE', '', true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'ACEITE COZINAR 900ml');

INSERT INTO productos (nombre, precio, Categoria, Oferta, Stock)
SELECT 
  'ARROZ DON ANGELO 1kg', 1800, 'ALIMENTO', '', true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'ARROZ DON ANGELO 1kg');

-- 7. Verificar configuración
SELECT 'Tabla productos creada' as status;
SELECT COUNT(*) as total_productos FROM productos;
SELECT 'Políticas creadas' as status FROM information_schema.policies WHERE table_name = 'productos';

-- ============================================
-- INSTRUCCIONES MANUALES (requeridas)
-- ============================================

-- PASO MANUAL 1: Crear el bucket en Storage
-- 1. Ve a Storage en el panel de Supabase
-- 2. Haz clic en "Create a new bucket"
-- 3. Name: product-images
-- 4. Marca "Public bucket"
-- 5. File size limit: 5MB
-- 6. Haz clic en Save

-- PASO MANUAL 2: Verificar configuración
-- 1. Ve a Table Editor > productos
-- 2. Deberías ver los productos insertados
-- 3. Ve a Storage > product-images
-- 4. Deberías ver el bucket vacío

-- ============================================
-- LISTO PARA USAR
-- ============================================
