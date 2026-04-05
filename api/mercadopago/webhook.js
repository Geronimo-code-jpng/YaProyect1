import { supabaseClient } from '../../src/db/supabeClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Para webhook de Mercado Pago, primero verificar que sea una notificación válida
  if (req.method === 'POST') {
    try {
      const { data, type } = req.body;
      
      console.log('🔔 Webhook recibido:', { type, data });
      
      // Procesar diferentes tipos de notificaciones
      if (type === 'payment') {
        const paymentId = data.id;
        
        // Obtener detalles del pago
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
          }
        });
        
        const paymentData = await paymentResponse.json();
        
        console.log('💳 Datos del pago:', paymentData);
        
        // Obtener el external_reference (ID del pedido)
        const pedidoId = paymentData.external_reference;
        
        if (!pedidoId) {
          console.error('❌ No se encontró external_reference en el pago');
          return res.status(400).json({ error: 'External reference no encontrado' });
        }
        
        // Actualizar estado del pedido según el estado del pago
        let nuevoEstado = 'pendiente';
        
        if (paymentData.status === 'approved') {
          nuevoEstado = 'pagado';
        } else if (paymentData.status === 'rejected') {
          nuevoEstado = 'rechazado';
        } else if (paymentData.status === 'cancelled') {
          nuevoEstado = 'cancelado';
        } else if (paymentData.status === 'in_process') {
          nuevoEstado = 'configurado'; // Mantener en configurado mientras procesa
        }
        
        // Actualizar el pedido en la base de datos
        const { error } = await supabaseClient
          .from('pedidos')
          .update({
            estado: nuevoEstado,
            pago_mp_id: paymentId,
            pago_mp_status: paymentData.status,
            pago_mp_date: new Date().toISOString(),
            metodo_pago: 'mercadopago'
          })
          .eq('id', pedidoId);
        
        if (error) {
          console.error('❌ Error actualizando pedido:', error);
          return res.status(500).json({ error: 'Error actualizando pedido' });
        }
        
        console.log(`✅ Pedido #${pedidoId} actualizado a estado: ${nuevoEstado}`);
        
        // Si el pago fue aprobado, enviar notificación WhatsApp
        if (nuevoEstado === 'pagado') {
          // Obtener datos completos del pedido para enviar WhatsApp
          const { data: pedido } = await supabaseClient
            .from('pedidos')
            .select('*')
            .eq('id', pedidoId)
            .single();
          
          if (pedido) {
            await enviarWhatsAppConfirmacionPago(pedido, paymentData);
          }
        }
        
        return res.status(200).json({ 
          success: true, 
          message: `Pedido #${pedidoId} actualizado a ${nuevoEstado}` 
        });
        
      } else if (type === 'merchant_order') {
        console.log('📦 Orden del comerciante:', data);
        return res.status(200).json({ success: true });
      }
      
    } catch (error) {
      console.error('❌ Error procesando webhook:', error);
      return res.status(500).json({ error: 'Error procesando webhook' });
    }
  }
  
  // Para verificación inicial de Mercado Pago (método GET)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook activo' });
  }
}

// Función para enviar WhatsApp de confirmación de pago
async function enviarWhatsAppConfirmacionPago(pedido, pagoData) {
  try {
    // Obtener lista de productos del carrito
    let productos = [];
    if (typeof pedido.carrito === 'string') {
      try {
        productos = JSON.parse(pedido.carrito);
      } catch (e) {
        productos = [];
      }
    } else if (Array.isArray(pedido.carrito)) {
      productos = pedido.carrito;
    }

    // Crear lista de productos para el mensaje
    const listaProductos = productos
      .map(
        (p) =>
          `• ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toLocaleString("es-AR")}`,
      )
      .join("\n");

    const message =
      `✅ *PAGO RECIBIDO - MERCADO PAGO*\n\n` +
      `📦 *Pedido #${pedido.id}*\n` +
      `👤 *Cliente:* ${pedido.nombre_cliente}\n\n` +
      `💳 *Detalles del pago:*\n` +
      `• ID Pago: ${pagoData.id}\n` +
      `• Método: ${pagoData.payment_method_id}\n` +
      `• Monto: $${Number(pagoData.transaction_amount).toLocaleString("es-AR")}\n` +
      `• Estado: ${pagoData.status}\n\n` +
      `🛒 *Tus productos:*\n${listaProductos}\n\n` +
      `💰 *Total:* $${Number(pedido.total).toLocaleString("es-AR")}\n\n` +
      `🎉 *¡Pago confirmado con éxito!*\n` +
      `📦 Tu pedido está siendo preparado para envío\n` +
      `🚚 Te contactaremos para coordinar la entrega`;

    const telefonoFormateado = pedido.telefono
      .replace(/\D/g, "")
      .replace(/^0/, "");
    const whatsappUrl = `https://wa.me/549${telefonoFormateado}?text=${encodeURIComponent(message)}`;
    
    // Enviar notificación (esto abrirá WhatsApp en el navegador del servidor)
    // En producción, podrías usar una API de WhatsApp como Twilio
    console.log('📱 WhatsApp URL generada:', whatsappUrl);
    
  } catch (error) {
    console.error("Error enviando WhatsApp de confirmación de pago:", error);
  }
}
