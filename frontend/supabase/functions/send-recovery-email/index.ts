import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Permitir acceso anónimo para recuperación de contraseña
  console.log('Procesando petición de recuperación de contraseña')

  try {
    const { email, token } = await req.json()

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "Email y token son requeridos" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Debug environment variables
    console.log('Environment check - RESEND_API_KEY exists:', !!Deno.env.get('RESEND_API_KEY'))
    console.log('Environment check - API key length:', Deno.env.get('RESEND_API_KEY')?.length)
    
    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      console.error('ERROR: RESEND_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const resend = new Resend(apiKey)

    console.log('Attempting to send email to:', email)
    
    const { data, error } = await resend.emails.send({
      from: 'no-reply@yamayorista.online',
      to: [email],
      subject: 'Recuperación de Contraseña',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Recuperación de Contraseña</h1>
          <p style="color: #666; line-height: 1.6;">
            Hola, hemos recibido una solicitud para recuperar tu contraseña. 
            Usa el siguiente token para restablecer tu contraseña:
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <strong style="font-size: 18px; color: #FF6600;">Token: ${token}</strong>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Si no solicitaste esta recuperación, puedes ignorar este email.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            Este es un email automático, por favor no responder.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending email:", error)
      return new Response(
        JSON.stringify({ error: "Error enviando email" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  } catch (error) {
    console.error("Error in function:", error)
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})
