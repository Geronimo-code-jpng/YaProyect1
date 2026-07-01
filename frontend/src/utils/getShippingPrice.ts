import { supabase as supabaseClient } from "../lib/supabase";

export async function getShippingPriceFromDB(): Promise<number> {
  try {
    const { data, error } = await supabaseClient
      .from("configuracion")
      .select("precio_envio")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error obteniendo precio de envío:", error);
      return 7300;
    }

    return data?.precio_envio || 7300;
  } catch (error) {
    console.error("Error general obteniendo precio de envío:", error);
    return 7300;
  }
}
