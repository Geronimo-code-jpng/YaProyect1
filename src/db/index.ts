import { supabase } from "../lib/supabase";

export default async function getRandomOfertProducts() {
  const { data, error } = await supabase.rpc("obtener_ofertas_aleatorias");

  if (error) {
    console.error("Error al obtener productos:", error);
  } else {
  }

  return data;
}
