import { useEffect } from 'react';

const CheckoutSuccess = ({ orderDetails }) => {
  useEffect(() => {
    // Verificamos que fbq (el objeto de Meta) esté disponible
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: orderDetails.total, // Ejemplo: 1500.00
        currency: 'ARS',          // O tu moneda local
        content_ids: orderDetails.ids, // Array de IDs de productos
        content_type: 'product',
      });
    }
  }, []); // El array vacío asegura que solo se ejecute una vez al montar el componente

  return (
    <div>
      <h1>¡Gracias por tu compra!</h1>
      <p>Tu pedido está siendo procesado.</p>
    </div>
  );
};

export default CheckoutSuccess;