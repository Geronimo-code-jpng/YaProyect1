import { fetchConfiguracion } from "../lib/catalogApi";

export async function getShippingPriceFromDB(): Promise<number> {
  try {
    const data = await fetchConfiguracion();
    return data?.precio_envio || 7300;
  } catch (error) {
    console.error("Error obteniendo precio de envío:", error);
    return 7300;
  }
}
