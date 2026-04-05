-- SQL simple para agregar un pedido modificado

-- Crear perfil de usuario si no existe
INSERT INTO perfiles (id, nombre, telefono, direccion, email, rol, tipo_cliente)
VALUES (
  '67adcadb-32a8-4e16-8531-3650eb490b6b',
  'Usuario de Prueba',
  '34259590000',
  'Dirección de prueba 123',
  'kk@gmail.com',
  'user',
  'Personal'
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  email = EXCLUDED.email,
  rol = EXCLUDED.rol,
  tipo_cliente = EXCLUDED.tipo_cliente;

-- Crear pedido modificado (con botón de confirmar)
INSERT INTO pedidos (
  nombre_cliente, telefono, direccion, carrito, total,
  estado, metodo, created_at, fuente, horario, user_id
)
VALUES (
  'Usuario de Prueba',
  '34259590000',
  'Dirección de prueba 123',
  '[{"Id": 1, "nombre": "Producto Modificado", "cantidad": 2, "precio": 1000, "subtotal": 2000}]',
  2000,
  'modificado',
  'envio',
  NOW(),
  'web',
  'Pedido modificado para probar botón',
  '67adcadb-32a8-4e16-8531-3650eb490b6b'
);
