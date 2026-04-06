import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  cart: any[];
  idPedido: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cart, idPedido }: RequestBody = await req.json()
    
    if (!cart || !idPedido) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos: cart y idPedido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPBASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Obtener datos del pedido
    const { data: pedido, error: pedidoError } = await supabaseClient
      .from('pedidos')
      .select('*')
      .eq('id', idPedido)
      .single()

    if (pedidoError || !pedido) {
      return new Response(
        JSON.stringify({ error: 'Pedido no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verificar que el pedido esté en estado configurado
    if (pedido.estado !== 'configurado') {
      return new Response(
        JSON.stringify({ error: 'El pedido no está listo para pagar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar que no haya expirado
    if (pedido.expira_en && new Date(pedido.expira_en) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'El tiempo de pago ha expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Configurar Mercado Pago
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Configuración de Mercado Pago no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Preparar items para Mercado Pago
    const items = cart.map((item: any) => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: Number(item.precio),
      currency_id: 'ARS',
      picture_url: item.imagen || ''
    }))

    // Crear preferencia de pago
    const preferenceData = {
      items,
      payer: {
        name: pedido.nombre_cliente || 'Cliente',
        email: pedido.email || '',
        phone: {
          number: pedido.telefono?.replace(/\D/g, '') || ''
        },
        address: {
          street_name: pedido.direccion || '',
          zip_code: ''
        }
      },
      external_reference: idPedido.toString(),
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mp`,
      back_urls: {
        success: `${Deno.env.get('PUBLIC_URL')}/pedidos?status=success&pedido=${idPedido}`,
        failure: `${Deno.env.get('PUBLIC_URL')}/pedidos?status=failure&pedido=${idPedido}`,
        pending: `${Deno.env.get('PUBLIC_URL')}/pedidos?status=pending&pedido=${idPedido}`
      },
      auto_return: 'approved',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(pedido.expira_en).toISOString(),
      statement_descriptor: 'YA Proyect1'
    }

    // Llamar a API de Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text()
      console.error('Error Mercado Pago:', errorData)
      return new Response(
        JSON.stringify({ error: 'Error al crear preferencia de pago', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const preference = await mpResponse.json()

    // Actualizar pedido con el ID de preferencia
    await supabaseClient
      .from('pedidos')
      .update({
        preferencia_mp_id: preference.id,
        fecha_preferencia: new Date().toISOString()
      })
      .eq('id', idPedido)

    return new Response(
      JSON.stringify({ 
        link_pago: preference.init_point,
        preference_id: preference.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error en crear-pago:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
