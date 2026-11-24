"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Google Maps se carga en el navegador, sin tipos */

// Dirección de entrega como en las apps de delivery: el cliente busca su
// dirección (sugerencias de Google) o usa su ubicación, y en un mapa a pantalla
// completa mueve el mapa hasta que el pin quede en su casa. Al continuar puede
// corregir la calle y el número. Ese punto viaja con el pedido, así el reparto
// no tiene que adivinar dónde queda "San José 2612".
//
// Si Google Maps no carga (sin clave, sin internet, un bloqueador), queda el
// campo de texto de siempre: nunca se deja de vender por el mapa.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, LocateFixed, ArrowLeft, Home } from "lucide-react";
import {
  cargarGoogleMaps,
  dentroDeZona,
  enLocalidadDeLaZona,
  FUERA_DE_ZONA,
  hayClaveDeMaps,
  SANTA_FE,
  sinPais,
  ZONA,
} from "../../lib/googleMaps";

export interface Direccion {
  direccion: string;
  referencia: string;
  lat: number | null;
  lon: number | null;
  /** Google Maps no está disponible: alcanza con el texto */
  sinMapa?: boolean;
}

/** Se puede pedir con envío: hay texto y, si el mapa funciona, un punto dentro de la zona. */
export const direccionLista = (d: Direccion) =>
  !!d.direccion?.trim() &&
  (d.lat != null && d.lon != null ? dentroDeZona(d.lat, d.lon) : !!d.sinMapa);

const campo =
  "w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#FF6600] transition";
const enlace = "font-semibold hover:underline cursor-pointer disabled:opacity-50";

// Dónde arranca el mapa a pantalla completa
interface Inicio {
  lat: number;
  lon: number;
  zoom: number;
  dir: string;
  /** Pedir el GPS al abrir */
  gps?: boolean;
}

interface Props {
  value: Direccion;
  onChange: (cambio: Partial<Direccion>) => void;
  cargando?: boolean;
  /** La dirección de la cuenta: si eligió "Cambiar", puede volver a ella */
  guardada?: { direccion?: string | null; referencia?: string | null; lat?: number | null; lon?: number | null } | null;
}

export default function DireccionEnMapa({ value, onChange, cargando, guardada }: Props) {
  const [maps, setMaps] = useState<any>(null);
  // null = todavía no escribió: se muestra lo que tenía la cuenta
  const [busqueda, setBusqueda] = useState<string | null>(null);
  const [foco, setFoco] = useState(false);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [aviso, setAviso] = useState("");
  const [pantalla, setPantalla] = useState<Inicio | null>(null);

  const token = useRef<any>(null);
  const cambiar = useRef(onChange);
  useEffect(() => {
    cambiar.current = onChange;
  });

  const sinMapa = !!value.sinMapa || !hayClaveDeMaps();
  const tienePunto = value.lat != null && value.lon != null;
  const modo = sinMapa ? "texto" : tienePunto ? "confirmada" : "buscar";

  // Avisar al pedido que alcanza con el texto
  useEffect(() => {
    if (!hayClaveDeMaps() && !value.sinMapa) cambiar.current({ sinMapa: true });
  }, [value.sinMapa]);

  // Google Maps se carga recién cuando hace falta
  const haceFaltaMaps = modo === "buscar" || !!pantalla;
  useEffect(() => {
    if (!haceFaltaMaps || maps) return;
    (window as any).gm_authFailure = () => {
      setPantalla(null);
      cambiar.current({ sinMapa: true });
    };
    cargarGoogleMaps()
      .then(setMaps)
      .catch(() => {
        setPantalla(null);
        cambiar.current({ sinMapa: true });
      });
  }, [haceFaltaMaps, maps]);

  const texto = busqueda ?? value.direccion ?? "";
  const buscando = !!maps && foco && texto.trim().length >= 3;
  const visibles = buscando ? sugerencias : [];

  // Sugerencias mientras escribe
  useEffect(() => {
    if (!buscando) return;
    let vigente = true;
    const t = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await maps.importLibrary("places");
        token.current ??= new AutocompleteSessionToken();
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: texto,
          sessionToken: token.current,
          includedRegionCodes: ["ar"],
          locationRestriction: ZONA,
          language: "es",
          region: "ar",
        });
        if (vigente) {
          setSugerencias(
            (suggestions || [])
              .filter((s: any) => s.placePrediction && enLocalidadDeLaZona(s.placePrediction.text?.toString() || ""))
              .slice(0, 5),
          );
        }
      } catch {
        if (vigente) setSugerencias([]);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [maps, buscando, texto]);

  // Eligió una sugerencia: se abre el mapa ahí para que ajuste el pin
  const elegir = async (s: any) => {
    setSugerencias([]);
    setAviso("");
    (document.activeElement as HTMLElement | null)?.blur();
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      token.current = null; // la búsqueda terminó: la próxima es otra sesión
      setPantalla({
        lat: place.location.lat(),
        lon: place.location.lng(),
        zoom: 18,
        dir: sinPais(place.formattedAddress || s.placePrediction.text?.toString()),
      });
    } catch {
      setAviso("No pudimos ubicar esa dirección. Probá con otra o marcala en el mapa.");
    }
  };

  const continuar = (p: { lat: number; lon: number; dir: string }) => {
    setPantalla(null);
    cambiar.current({ direccion: p.dir, lat: p.lat, lon: p.lon });
  };

  const otraDireccion = () => {
    setAviso("");
    setBusqueda("");
    cambiar.current({ lat: null, lon: null });
  };

  const referencia = (
    <input
      type="text"
      value={value.referencia || ""}
      onChange={(e) => onChange({ referencia: e.target.value })}
      className={`${campo} mt-2`}
      placeholder="Referencia (opcional): portón verde, timbre 2…"
      maxLength={120}
    />
  );

  const mapa = pantalla && (
    <PantallaMapa maps={maps} inicio={pantalla} onCerrar={() => setPantalla(null)} onContinuar={continuar} />
  );

  if (cargando) {
    return <input className={`${campo} bg-gray-100 text-gray-500`} value="Cargando..." readOnly />;
  }

  if (modo === "texto") {
    return (
      <div>
        <input
          type="text"
          value={value.direccion}
          onChange={(e) => onChange({ direccion: e.target.value })}
          name="direccion"
          className={campo}
          placeholder="Calle y número, barrio"
        />
        {referencia}
      </div>
    );
  }

  if (modo === "confirmada") {
    const fuera = !dentroDeZona(value.lat!, value.lon!);
    return (
      <div>
        <div className="p-3 border border-gray-200 rounded-xl bg-orange-50/40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <MapPin size={14} className="text-[#FF6600]" /> Entregar en (calle y número):
            </p>
            <button
              type="button"
              onClick={otraDireccion}
              className="shrink-0 px-3 py-1 rounded-lg border border-[#FF6600] text-[#FF6600] text-xs font-bold hover:bg-orange-50 cursor-pointer"
            >
              Cambiar
            </button>
          </div>
          <input
            type="text"
            value={value.direccion}
            onChange={(e) => onChange({ direccion: e.target.value })}
            name="direccion"
            className={`${campo} bg-white`}
            placeholder="Escribí tu calle y número"
          />
          {fuera && <p className="text-xs text-red-600 mt-1">{FUERA_DE_ZONA} Elegí otra dirección.</p>}
          {!fuera && !value.direccion.trim() && (
            <p className="text-xs text-red-600 mt-1">Escribí la calle y el número, así lo lee el repartidor.</p>
          )}
          <button
            type="button"
            onClick={() => setPantalla({ lat: value.lat!, lon: value.lon!, zoom: 18, dir: value.direccion })}
            className={`${enlace} text-[#FF6600] text-sm mt-2`}
          >
            Ajustar el pin en el mapa
          </button>
        </div>
        {referencia}
        {mapa}
      </div>
    );
  }

  // modo "buscar"
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={texto}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          className={campo}
          name="direccion"
          placeholder="Buscá tu calle y número"
          autoComplete="off"
        />
        {visibles.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {visibles.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  // mousedown y no click: si no, el blur cierra la lista antes
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(s);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex gap-2 items-start cursor-pointer"
                >
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    <span className="block font-semibold text-gray-800">{s.placePrediction.mainText?.toString()}</span>
                    <span className="block text-xs text-gray-500">{sinPais(s.placePrediction.secondaryText?.toString())}</span>
                  </span>
                </button>
              </li>
            ))}
            <li className="px-4 py-1 text-[10px] text-gray-400 text-right">Sugerencias de Google</li>
          </ul>
        )}
      </div>
      {aviso && <p className="text-xs text-red-600 mt-1">{aviso}</p>}
      {guardada?.lat != null && guardada.lon != null && guardada.direccion && (
        <button
          type="button"
          onClick={() =>
            onChange({
              direccion: guardada.direccion || "",
              referencia: guardada.referencia || "",
              lat: guardada.lat,
              lon: guardada.lon,
            })
          }
          className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-orange-50 text-left cursor-pointer"
        >
          <Home size={16} className="text-[#FF6600] shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs text-gray-500">Mi dirección guardada</span>
            <span className="block text-sm font-semibold text-gray-800 truncate">{guardada.direccion.split(",")[0]}</span>
          </span>
        </button>
      )}
      {/* Discretos a propósito: el buscador es lo principal (y lo más barato) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
        <button
          type="button"
          onClick={() => setPantalla({ lat: SANTA_FE.lat, lon: SANTA_FE.lng, zoom: 15, dir: "", gps: true })}
          disabled={!maps}
          className={`${enlace} font-medium inline-flex items-center gap-1`}
        >
          <LocateFixed size={13} /> Usar mi ubicación
        </button>
        {texto.trim().length >= 3 && (
          <button
            type="button"
            onClick={() => setPantalla({ lat: SANTA_FE.lat, lon: SANTA_FE.lng, zoom: 15, dir: "" })}
            disabled={!maps}
            className={`${enlace} font-medium`}
          >
            ¿No aparece? Marcala en el mapa
          </button>
        )}
      </div>
      {mapa}
    </div>
  );
}

// Estilo del mapa: gris claro y limpio, como las apps de delivery. Calles
// blancas, manzanas marcadas, agua celeste suave y sin negocios ni íconos que
// distraigan del pin.
const ESTILO_MAPA = [
  { elementType: "geometry", stylers: [{ color: "#ebebe8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a7a7a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#8f8f8f" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#ebebe8" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#c9c9c4" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#cfe9d8" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  // Calles: blancas con borde gris marcado, así se ven también de lejos
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#c4c4bf" }, { weight: 0.8 }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6f6f6f" }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }, { weight: 1.5 }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }, { weight: 2.5 }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#b5b5b0" }, { weight: 1 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfe0f2" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8fb8cf" }] },
];

// El mapa a pantalla completa. El pin queda fijo en el centro y se mueve el
// mapa (más fácil con el dedo que arrastrar un pin chiquito); el cartel de
// arriba del pin dice qué dirección es cada vez que el mapa se detiene.
function PantallaMapa({
  maps,
  inicio,
  onCerrar,
  onContinuar,
}: {
  maps: any;
  inicio: Inicio;
  onCerrar: () => void;
  onContinuar: (p: { lat: number; lon: number; dir: string }) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<any>(null);
  const geocodificar = useRef(false); // recién cuando la persona mueve el mapa o llega el GPS
  const turno = useRef(0);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [centro, setCentro] = useState({ lat: inicio.lat, lon: inicio.lon });
  const [dir, setDir] = useState(inicio.dir);
  const [buscandoDir, setBuscandoDir] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [avisoGps, setAvisoGps] = useState("");

  // Que no se mueva la página de atrás mientras el mapa está abierto
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  const pedirGps = () => {
    if (!navigator.geolocation) {
      setAvisoGps("Tu navegador no comparte la ubicación: mové el mapa hasta tu casa.");
      return;
    }
    setUbicando(true);
    setAvisoGps("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUbicando(false);
        geocodificar.current = true;
        mapaRef.current?.setZoom(18);
        mapaRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        setUbicando(false);
        setAvisoGps("No pudimos acceder a tu ubicación: mové el mapa hasta tu casa.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const gpsRef = useRef(pedirGps);
  useEffect(() => {
    gpsRef.current = pedirGps;
  });

  useEffect(() => {
    if (!maps || !caja.current) return;
    let listo = true;
    const escuchas: any[] = [];

    const buscarDireccion = (lat: number, lon: number) => {
      if (espera.current) clearTimeout(espera.current);
      const mio = ++turno.current;
      if (!dentroDeZona(lat, lon)) {
        setBuscandoDir(false);
        return;
      }
      setBuscandoDir(true);
      espera.current = setTimeout(async () => {
        let nueva = "";
        try {
          const { Geocoder } = await maps.importLibrary("geocoding");
          const { results } = await new Geocoder().geocode({ location: { lat, lng: lon } });
          const r =
            results?.find((x: any) => x.types?.includes("street_address") || x.types?.includes("premise")) ||
            results?.[0];
          nueva = sinPais(r?.formatted_address);
        } catch {
          /* sin dirección: la escribe la persona al continuar */
        }
        if (mio !== turno.current) return;
        setDir(nueva);
        setBuscandoDir(false);
      }, 500);
    };

    maps.importLibrary("maps").then(({ Map }: any) => {
      if (!listo || !caja.current) return;
      const mapa = new Map(caja.current, {
        center: { lat: inicio.lat, lng: inicio.lon },
        zoom: inicio.zoom,
        styles: ESTILO_MAPA,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
        keyboardShortcuts: false,
      });
      mapaRef.current = mapa;
      escuchas.push(
        mapa.addListener("dragstart", () => {
          geocodificar.current = true;
        }),
        mapa.addListener("idle", () => {
          const c = mapa.getCenter();
          if (!c) return;
          setCentro({ lat: c.lat(), lon: c.lng() });
          if (geocodificar.current) buscarDireccion(c.lat(), c.lng());
        }),
      );
      if (inicio.gps) gpsRef.current();
    });

    return () => {
      listo = false;
      escuchas.forEach((e) => e.remove());
      if (espera.current) clearTimeout(espera.current);
    };
  }, [maps, inicio]);

  const fuera = !dentroDeZona(centro.lat, centro.lon);
  const calle = dir.split(",")[0];
  const cartel = ubicando
    ? "Buscando tu ubicación…"
    : fuera
      ? "Fuera de la zona de entrega"
      : buscandoDir
        ? "Buscando dirección…"
        : calle || "Mové el mapa hasta tu casa";

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 flex md:items-center md:justify-center">
      <div className="bg-white w-full h-[100dvh] md:h-[85vh] md:max-w-lg md:rounded-2xl overflow-hidden flex flex-col">
        <div className="relative flex items-center justify-center h-16 shrink-0 bg-white">
          <button
            type="button"
            onClick={onCerrar}
            className="absolute left-3 w-11 h-11 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-50"
            aria-label="Volver"
          >
            <ArrowLeft size={22} className="text-[#14122e]" />
          </button>
          <h3 className="text-lg font-black text-[#14122e]">Tu ubicación</h3>
        </div>

        <div className="relative flex-1 bg-[#ebebe8]">
          <div ref={caja} className="absolute inset-0" />
          {!maps && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">Cargando mapa...</p>
          )}
          {/* Cartel + pin: la punta del pin es el centro del mapa */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none">
            <div
              className={`relative mb-3 px-5 py-2.5 rounded-2xl text-[15px] text-white shadow-lg max-w-[270px] ${
                fuera && !ubicando ? "bg-red-600" : "bg-[#14122e]"
              }`}
            >
              <span className="block truncate">{cartel}</span>
              {/* flechita que apunta al pin */}
              <span
                className={`absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3.5 h-3.5 rotate-45 rounded-[2px] ${
                  fuera && !ubicando ? "bg-red-600" : "bg-[#14122e]"
                }`}
              />
            </div>
            <svg width="44" height="56" viewBox="0 0 44 56" className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]">
              <path d="M22 1C10.4 1 1 10.4 1 22c0 15.5 21 33 21 33s21-17.5 21-33C43 10.4 33.6 1 22 1z" fill="#1c1c24" />
              <circle cx="22" cy="21" r="8.5" fill="#d9d9d4" />
              <circle cx="20" cy="19" r="3" fill="#f2f2ee" />
            </svg>
          </div>
          {/* sombra en la punta del pin */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1.5 rounded-full bg-black/25 pointer-events-none" />
          <button
            type="button"
            onClick={pedirGps}
            disabled={!maps || ubicando}
            className="absolute right-4 bottom-4 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-60"
            aria-label="Usar mi ubicación"
          >
            <LocateFixed size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="shrink-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)] bg-white">
          <h4 className="text-xl font-black text-[#14122e]">Indicá dónde recibir tu pedido</h4>
          <p className={`text-sm mt-1 ${fuera ? "text-red-600" : "text-gray-600"}`}>
            {fuera
              ? FUERA_DE_ZONA
              : avisoGps || "Mové el mapa hasta que el pin quede en tu casa. Al continuar, podrás editar la calle y el número."}
          </p>
          <button
            type="button"
            onClick={() => onContinuar({ lat: centro.lat, lon: centro.lon, dir })}
            disabled={!maps || fuera || buscandoDir || ubicando}
            className="w-full mt-4 py-4 rounded-2xl bg-[#FF6600] hover:bg-orange-700 text-white font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
