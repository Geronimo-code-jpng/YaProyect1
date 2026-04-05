import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://vcbqhwxlwmhwdbcplgbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjYnFod3hsd21od2RiY3BsZ2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDI4MzAsImV4cCI6MjA5MDAxODgzMH0.8gB7gNCVHOhQTuk2qWFgGvdpxZXHAc9LsIRST3fcMiA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  try {
    console.log('🔄 Agregando datos de prueba...');

    // 1. Crear un pedido de prueba
    const pedidoPrueba = {
      nombre_cliente: "Usuario de Prueba",
      telefono: "34259590000", 
      email: "kk@gmail.com",
      direccion: "Dirección de prueba 123",
      carrito: [
        {
          Id: 1,
          nombre: "Producto de Prueba 1",
          cantidad: 2,
          precio: 1000,
          subtotal: 2000
        },
        {
          Id: 2,
          nombre: "Producto de Prueba 2", 
          cantidad: 1,
          precio: 500,
          subtotal: 500
        }
      ],
      total: 2500,
      estado: "modificado_pendiente",
      metodo: "envio",
      created_at: new Date().toISOString(),
      fuente: "web",
      horario: "Pedido de prueba para modificar",
      user_id: "67adcadb-32a8-4e16-8531-3650eb490b6b"
    };

    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert(pedidoPrueba)
      .select()
      .single();

    if (pedidoError) {
      console.error('❌ Error creando pedido:', pedidoError);
      return;
    }

    console.log('✅ Pedido creado:', pedidoData);

    // 2. Crear un segundo pedido normal para comparar
    const pedidoNormal = {
      nombre_cliente: "Usuario de Prueba",
      telefono: "34259590000",
      email: "kk@gmail.com", 
      direccion: "Dirección de prueba 123",
      carrito: [
        {
          Id: 3,
          nombre: "Producto Normal",
          cantidad: 1,
          precio: 1500,
          subtotal: 1500
        }
      ],
      total: 1500,
      estado: "pendiente",
      metodo: "envio", 
      created_at: new Date().toISOString(),
      fuente: "web",
      horario: "Pedido normal de prueba",
      user_id: "67adcadb-32a8-4e16-8531-3650eb490b6b"
    };

    const { data: normalData, error: normalError } = await supabase
      .from('pedidos')
      .insert(pedidoNormal)
      .select()
      .single();

    if (normalError) {
      console.error('❌ Error creando pedido normal:', normalError);
      return;
    }

    console.log('✅ Pedido normal creado:', normalData);

    // 3. Crear un perfil de usuario si no existe
    const perfil = {
      id: "67adcadb-32a8-4e16-8531-3650eb490b6b",
      nombre: "Usuario de Prueba",
      telefono: "34259590000",
      direccion: "Dirección de prueba 123",
      email: "kk@gmail.com",
      rol: "user",
      tipo_cliente: "Personal"
    };

    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .upsert(perfil)
      .select()
      .single();

    if (perfilError) {
      console.error('❌ Error creando perfil:', perfilError);
    } else {
      console.log('✅ Perfil creado/actualizado:', perfilData);
    }

    console.log('🎉 Datos de prueba agregados exitosamente!');
    console.log('📋 Ahora deberías ver:');
    console.log('   - 1 pedido con estado "modificado_pendiente" (con botones)');
    console.log('   - 1 pedido con estado "pendiente" (normal)');
    console.log('   - Perfil de usuario completado');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
addTestData();
