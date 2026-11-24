/* eslint-disable @typescript-eslint/no-explicit-any -- Google Maps se carga en el navegador, sin tipos */
// Carga Google Maps una sola vez, recién cuando alguien va a elegir una
// dirección (cargar el script no se cobra; sí cada mapa y cada búsqueda).
//
// La clave es pública por naturaleza: va en el navegador. Se protege en Google
// Cloud restringiéndola a yamayorista.online y localhost, y solo a Maps
// JavaScript API, Places API (New) y Geocoding API, con un tope de uso diario.

const CLAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Zona de entrega: 15 km alrededor del centro de Santa Fe capital (30 km de
// diámetro). Las sugerencias se limitan a este cuadrado y después se mide la
// distancia de verdad, porque Google deja pasar alguna calle de afuera.
export const SANTA_FE = { lat: -31.6333, lng: -60.7 };
export const RADIO_KM = 15;
const dLat = RADIO_KM / 111.32;
const dLng = RADIO_KM / (111.32 * Math.cos((SANTA_FE.lat * Math.PI) / 180));
export const ZONA = {
  south: SANTA_FE.lat - dLat,
  north: SANTA_FE.lat + dLat,
  west: SANTA_FE.lng - dLng,
  east: SANTA_FE.lng + dLng,
};

export function dentroDeZona(lat: number, lon: number) {
  const rad = (g: number) => (g * Math.PI) / 180;
  const a =
    Math.sin(rad(lat - SANTA_FE.lat) / 2) ** 2 +
    Math.cos(rad(SANTA_FE.lat)) * Math.cos(rad(lat)) * Math.sin(rad(lon - SANTA_FE.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a)) <= RADIO_KM;
}

// Localidades dentro de la zona. Una sugerencia que no nombra ninguna no se
// muestra (Google mezcla calles homónimas de otros pueblos).
const LOCALIDADES = ["santa fe de la vera cruz", "santo tome", "recreo", "rincon", "colastine"];
const normal = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const enLocalidadDeLaZona = (texto: string) => LOCALIDADES.some((l) => normal(texto).includes(l));

export const FUERA_DE_ZONA = `Por ahora entregamos solo en Santa Fe capital y alrededores (${RADIO_KM} km del centro).`;

export const hayClaveDeMaps = () => !!CLAVE;

// Cuenta recién creada: el aviso de ubicación (AvisoUbicacion) abre directo el
// mapa en vez de mostrar solo el cartel. Va en sessionStorage porque después
// del registro la página se recarga.
export const AVISO_UBICACION = "yaAvisoUbicacion";
export function pedirUbicacionAlEntrar() {
  try {
    sessionStorage.setItem(AVISO_UBICACION, "pedir");
  } catch {
    /* sin almacenamiento: queda el cartel de siempre */
  }
}

let carga: Promise<any> | null = null;

export function cargarGoogleMaps(): Promise<any> {
  if (!CLAVE) return Promise.reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  if (typeof window === "undefined") return Promise.reject(new Error("Solo en el navegador"));
  const w = window as any;
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google.maps);
  if (!carga) {
    carga = new Promise((ok, mal) => {
      w.__yaMapsListo = () => ok(w.google.maps);
      const s = document.createElement("script");
      s.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CLAVE)}` +
        `&v=weekly&loading=async&language=es&region=AR&callback=__yaMapsListo`;
      s.async = true;
      s.onerror = () => {
        carga = null;
        mal(new Error("No cargó Google Maps"));
      };
      document.head.appendChild(s);
    });
  }
  return carga;
}

// "San José 2612, S3000 Santa Fe de la Vera Cruz, Santa Fe, Argentina"
//   → "San José 2612, S3000 Santa Fe de la Vera Cruz, Santa Fe"
export const sinPais = (t?: string) => (t || "").replace(/,\s*Argentina\s*$/i, "").trim();
