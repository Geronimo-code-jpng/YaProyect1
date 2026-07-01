import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) throw new Error("Falta configurar el MP_ACCESS_TOKEN")

    const url = new URL(req.url);
    let idPago = url.searchParams.get("data.id") || url.searchParams.get("id");
    let topic = url.searchParams.get("type") || url.searchParams.get("topic");

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (body.data && body.data.id) idPago = body.data.id;
      if (body.type) topic = body.type;
      if (body.action) topic = body.action; 
    }

    if (idPago === "123456") {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if ((topic === "payment" || topic === "merchant_order" || topic === "payment.updated") && idPago) {
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${idPago}`, {
        headers: { "Authorization": `Bearer ${mpToken}` }
      });
      
      if (!mpResponse.ok) throw new Error("No se pudo validar el pago con MP");
      
      const pago = await mpResponse.json();

      if (pago.status === "approved") {
        const idDelPedido = pago.external_reference; 

        if (idDelPedido) {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL'), 
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          );

          // 👉 ACÁ ESTÁ EL ARREGLO: Convertimos a Número (Number) y agregamos .select()
          const { data, error } = await supabase
            .from('pedidos')
            .update({ estado: 'pagado' })
            .eq('id', Number(idDelPedido))
            .select();

          if (error) {
            console.error("Error al actualizar Supabase:", error);
          } else if (!data || data.length === 0) {
            // Si entra acá, es porque buscó el ID pero no lo encontró en tu tabla
            console.error(`Ojo: El pedido #${idDelPedido} no se encontró en la base de datos para actualizar.`);
          } else {
            console.log(`¡Exito REAL! Pedido #${idDelPedido} guardado en BD como PAGADO:`, data);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error en Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
