// Deno Supabase Edge Function - TypeScript analysis disabled
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// @ts-ignore - Deno environment variables
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, data } = body

    console.log('Webhook recibido:', { action, data })

    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Procesar diferentes tipos de notificaciones
    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id
      
      // Obtener detalles del pago desde Mercado Pago
      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      if (!accessToken) {
        throw new Error('Access token de Mercado Pago no configurado')
      }

      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!paymentResponse.ok) {
        throw new Error('Error obteniendo detalles del pago')
      }

      const paymentData: MercadoPagoPayment = await paymentResponse.json()
      console.log('Datos del pago:', paymentData)

      // Obtener el external_reference (ID del pedido)
      const pedidoId = paymentData.external_reference
      if (!pedidoId) {
        throw new Error('External reference no encontrado en el pago')
      }

      // Determinar el nuevo estado del pedido
      let nuevoEstado = 'pendiente'
      
      if (paymentData.status === 'approved') {
        nuevoEstado = 'pagado'
      } else if (paymentData.status === 'rejected') {
        nuevoEstado = 'rechazado'
      } else if (paymentData.status === 'cancelled') {
        nuevoEstado = 'cancelado'
      } else if (paymentData.status === 'in_process') {
        nuevoEstado = 'configurado' // Mantener en configurado mientras procesa
      }

      // Actualizar el pedido en la base de datos
      const updateData = {
        estado: nuevoEstado,
        pago_mp_id: paymentId,
        pago_mp_status: paymentData.status,
        pago_mp_date: new Date().toISOString(),
        metodo_pago: 'mercadopago',
        payment_details: {
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          payment_method_id: paymentData.payment_method_id,
          payment_type: paymentData.payment_type,
          transaction_amount: paymentData.transaction_amount,
          installments: paymentData.installments,
          issuer_id: paymentData.issuer_id
        }
      }

      const { error } = await supabaseClient
        .from('pedidos')
        .update(updateData)
        .eq('id', pedidoId)

      if (error) {
        throw new Error(`Error actualizando pedido: ${error.message}`)
      }

      console.log(`✅ Pedido #${pedidoId} actualizado a estado: ${nuevoEstado}`)

      // Si el pago fue aprobado, enviar notificación WhatsApp
      if (nuevoEstado === 'pagado') {
        // Obtener datos completos del pedido
        const { data: pedido } = await supabaseClient
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single()

        if (pedido) {
          await enviarWhatsAppConfirmacionPago(pedido, paymentData)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Pedido #${pedidoId} actualizado a ${nuevoEstado}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook procesado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error en webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error procesando webhook', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Función para enviar WhatsApp de confirmación de pago
async function enviarWhatsAppConfirmacionPago(pedido: any, pagoData: any) {
  try {
    // Obtener lista de productos del carrito
    let productos = []
    if (typeof pedido.carrito === 'string') {
      try {
        productos = JSON.parse(pedido.carrito)
      } catch (e) {
        productos = []
      }
    } else if (Array.isArray(pedido.carrito)) {
      productos = pedido.carrito
    }

    // Crear lista de productos para el mensaje
    const listaProductos = productos
      .map((p: any) =>
        `• ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toLocaleString("es-AR")}`
      )
      .join("\n")

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
      `🚚 Te contactaremos para coordinar la entrega`

    const telefonoFormateado = pedido.telefono
      .replace(/\D/g, "")
      .replace(/^0/, "")
    const whatsappUrl = `https://wa.me/549${telefonoFormateado}?text=${encodeURIComponent(message)}`
    
    // Enviar notificación (esto abrirá WhatsApp en el navegador del servidor)
    // En producción, podrías usar una API de WhatsApp como Twilio
    console.log('📱 WhatsApp URL generada:', whatsappUrl)
    
  } catch (error) {
    console.error("Error enviando WhatsApp de confirmación de pago:", error instanceof Error ? error.message : 'Unknown error')
  }
}
