const {MercadoPagoConfig, Preference} = require('mercadopago');

// Configurar Mercado Pago con tu access token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const preferenceData = req.body;
    
    // Crear la preferencia de pago
    const preference = new Preference(client);
    
    const preferenceResponse = await preference.create({
      body: {
        items: preferenceData.items,
        payer: preferenceData.payer,
        external_reference: preferenceData.external_reference,
        notification_url: preferenceData.notification_url,
        back_urls: preferenceData.back_urls,
        auto_return: preferenceData.auto_return,
        expires: preferenceData.expires,
        expiration_date_from: preferenceData.expiration_date_from,
        expiration_date_to: preferenceData.expiration_date_to,
        statement_descriptor: 'YA Proyect1',
      }
    });

    res.status(200).json({
      init_point: preferenceResponse.init_point,
      sandbox_init_point: preferenceResponse.sandbox_init_point,
      preference_id: preferenceResponse.id
    });

  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    res.status(500).json({ 
      error: 'Error al crear preferencia de pago',
      details: error.message 
    });
  }
}
