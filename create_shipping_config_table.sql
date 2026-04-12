-- Crear tabla de configuración para el precio de envío
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY DEFAULT 1,
  precio_envio INTEGER NOT NULL DEFAULT 7200,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial si no existe
INSERT INTO configuracion (id, precio_envio, updated_at, created_at)
VALUES (1, 7200, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Crear política RLS para que solo administradores puedan modificar
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios
CREATE POLICY "Todos pueden leer configuración" ON configuracion
  FOR SELECT USING (true);

-- Política para permitir modificaciones solo a administradores
CREATE POLICY "Solo administradores pueden modificar configuración" ON configuracion
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol = 'admin'
    )
  );

-- Política para permitir inserciones solo a administradores
CREATE POLICY "Solo administradores pueden insertar configuración" ON configuracion
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol = 'admin'
    )
  );
