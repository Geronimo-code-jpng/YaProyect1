"use client";

import { AuthModal } from "../auth";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { ProfileModal } from "../profile";

import {
  ShoppingCart,
  CircleUserRound,
  User,
  PackageOpen,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Tag,
  ChevronDown,
  MessageCircle,
  Search,
  House,
  ChevronRight,
  Clock,
  LogIn,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { fetchProductos } from "../../lib/catalogApi";
import PhraseGroup from "./BucleSlogan";
import { precioBulto } from "../../lib/presentaciones";
import type { Product } from "../../types";

export default function NavBar() {
  const { user, userProfile } = useAuth();
  const { cartCount, getCartTotalWithDiscount, qualifiesForFirstBuyDiscount } =
    useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [productos, setProductos] = useState<Product[]>([]);
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false);
  const esperaBusqueda = useRef(null);
  const enProductos = pathname === "/productos";

  // En /productos el buscador muestra lo que se está buscando; en otra página,
  // vacío. Lo que el mismo buscador acaba de poner en la URL no se vuelve a
  // copiar: mientras tanto se pudo haber seguido escribiendo.
  const busquedaUrl = enProductos ? searchParams.get("search") || "" : "";
  const [busqueda, setBusqueda] = useState(busquedaUrl);
  const [busquedaUrlAnterior, setBusquedaUrlAnterior] = useState(busquedaUrl);
  const [busquedaEnviada, setBusquedaEnviada] = useState<string | null>(null);
  if (busquedaUrl !== busquedaUrlAnterior) {
    setBusquedaUrlAnterior(busquedaUrl);
    if (busquedaUrl !== busquedaEnviada) setBusqueda(busquedaUrl);
  }

  // En /productos la grilla se filtra mientras se escribe (sin sacar del buscador)
  const ponerEnUrl = (texto: string) => {
    const q = texto.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("search", q);
    else params.delete("search");
    setBusquedaEnviada(q);
    router.replace(`/productos${params.toString() ? `?${params}` : ""}`, { scroll: false });
  };

  const escribir = (texto: string) => {
    setBusqueda(texto);
    setSugerenciasAbiertas(true);
    if (!enProductos) return;
    clearTimeout(esperaBusqueda.current);
    esperaBusqueda.current = setTimeout(() => ponerEnUrl(texto), 300);
  };

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(esperaBusqueda.current);
    setSugerenciasAbiertas(false);
    if (enProductos) return ponerEnUrl(busqueda);
    const q = busqueda.trim();
    router.push(q ? `/productos?search=${encodeURIComponent(q)}` : "/productos");
  };

  // Fuera de /productos, los que coinciden aparecen abajo del buscador
  const textoBuscado = busqueda.trim().toLowerCase();
  const sugerencias =
    enProductos || textoBuscado.length < 2
      ? []
      : productos
          .filter((p) => (p.nombre || "").toLowerCase().includes(textoBuscado))
          .sort((a, b) => Number(!!b.Stock) - Number(!!a.Stock))
          .slice(0, 6);

  const buscador = (
    <div className="relative w-full">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="search"
        value={busqueda}
        onChange={(e) => escribir(e.target.value)}
        onFocus={() => setSugerenciasAbiertas(true)}
        onBlur={() => setSugerenciasAbiertas(false)}
        onKeyDown={(e) => e.key === "Escape" && setSugerenciasAbiertas(false)}
        placeholder="Buscá bebidas, almacén, limpieza…"
        aria-label="Buscar productos"
        className="w-full h-11 pl-11 pr-4 rounded-full bg-white text-sm text-gray-800 placeholder:text-gray-400 shadow-sm outline-none focus:ring-4 focus:ring-white/30"
      />
      {sugerenciasAbiertas && !enProductos && textoBuscado.length >= 2 && (
        // onMouseDown: que el clic no le saque el foco al buscador antes de navegar
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
        >
          {sugerencias.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500">
              No encontramos productos con “{busqueda.trim()}”
            </p>
          ) : (
            sugerencias.map((p) => (
              <Link
                key={p.Id}
                href={`/producto/${p.Id}`}
                onClick={() => {
                  setSugerenciasAbiertas(false);
                  setBusqueda("");
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition"
              >
                <div className="relative w-10 h-10 shrink-0">
                  <Image
                    src={p.Imagen || p.imagen || "/producto-placeholder.svg"}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain mix-blend-multiply"
                  />
                </div>
                <span className="flex-1 text-sm font-bold text-gray-800 line-clamp-1">{p.nombre}</span>
                <span className={`text-sm font-black ${p.Stock ? "text-[#f74d00]" : "text-gray-400"}`}>
                  {p.Stock ? `$${precioBulto(p).toLocaleString("es-AR")}` : "Sin stock"}
                </span>
              </Link>
            ))
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 text-sm font-bold text-[#f74d00] border-t border-gray-100 hover:bg-orange-50 transition text-left"
          >
            Ver todos los resultados para “{busqueda.trim()}”
          </button>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchProductos();
        setProductos(data);
        const uniqueCategories = [
          ...new Set(data.map((p) => p.Categoria).filter(Boolean)),
        ].sort();
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    };

    loadCategories();
  }, []);

  const toggleCart = () => {
    router.push("/cart");
  };

  const getDisplayName = () => {
    if (userProfile?.nombre) {
      return userProfile.nombre.split(" ")[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "";
  };

  const displayName = getDisplayName();
  let isAdmin = null;
  if (userProfile) {
    isAdmin = userProfile.rol == "admin";
  }

  return (
    <div className={`sticky top-0 ${mobileMenuOpen ? "z-9001" : "z-40"}`}>
      {isAdmin && (
        <div className="text-center py-2 bg-red-600">
          <Link
            href="/admin"
            className="text-white hover:text-red-100 font-bold text-sm transition inline-flex items-center gap-2"
          >
            <i className="fas fa-tools"></i> Panel Admin
          </Link>
        </div>
      )}
      <div className="bg-white shadow-md">
        <PhraseGroup />
        <div className="bg-[#f74d00]">
          <div className="max-w-7xl mx-auto px-2 md:px-6 h-16 flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú"
              className="lg:hidden flex items-center text-white p-2 rounded-full transition hover:bg-white/15"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer shrink-0 transition"
            >
              <span className="text-white text-4xl font-black italic leading-none">
                YA!
              </span>
              <span className="hidden sm:block text-xl font-black text-white tracking-tight leading-none">
                MAYORISTA
              </span>
            </Link>

            {/* Navigation Menu - Simple */}
            <nav className="hidden lg:flex items-center text-sm font-bold gap-1">
              <Link
                href="/"
                className={`px-3 py-1.5 text-sm font-medium transition rounded-lg text-white hover:bg-white/20`}
              >
                Inicio
              </Link>

              <div
                className="relative"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current)
                    clearTimeout(hoverTimeoutRef.current);
                  setCategoriesOpen(true);
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(
                    () => setCategoriesOpen(false),
                    250,
                  );
                }}
              >
                <Link
                  href="/productos"
                  className={`px-3 py-1.5 text-sm font-medium transition rounded-lg flex items-center gap-1 group ${
                    pathname === "/productos"
                      ? "text-white bg-white/20"
                      : "text-white hover:text-white hover:bg-white/20"
                  }`}
                >
                  Productos
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-150 rotate-180 group-hover:rotate-0"
                  />
                </Link>
                {categoriesOpen && categories.length > 0 && (
                  <div
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current)
                        clearTimeout(hoverTimeoutRef.current);
                      setCategoriesOpen(true);
                    }}
                    onMouseLeave={() => {
                      hoverTimeoutRef.current = setTimeout(
                        () => setCategoriesOpen(false),
                        250,
                      );
                    }}
                    className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[220px] z-50"
                  >
                    <Link
                      href="/productos"
                      onClick={() => setCategoriesOpen(false)}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-[#FF6600] transition"
                    >
                      Todos los productos
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/productos?categoria=${cat}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-[#FF6600] transition"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/productos?categoria=SoloOfertas"
                className={`px-3 py-1.5 text-sm font-medium transition rounded-lg flex items-center gap-1 ${
                  pathname === "/productos" &&
                  searchParams.toString().includes("SoloOfertas")
                    ? "text-white bg-white/20"
                    : "text-white hover:text-white hover:bg-white/20"
                }`}
              >
                <Tag size={14} />
                Ofertas
              </Link>
            </nav>

            {/* Buscador: en computadora va en la barra; en el celular, abajo */}
            <form onSubmit={buscar} className="hidden md:flex flex-1 max-w-xl mx-auto">
              {buscador}
            </form>

            <div className="flex items-center shrink-0 ml-auto md:ml-0 gap-1">
              {!user ? (
                <Link
                  href="/login"
                  id="btnIngresarMain"
                  className="flex items-center gap-2 text-white px-3 py-2 rounded-full font-bold transition hover:bg-white/15"
                >
                  <CircleUserRound className="w-7 h-7" />
                  <span className="hidden sm:inline text-sm">Ingresar</span>
                </Link>
              ) : (
                <div className="flex items-center">
                  <button
                    onClick={() => router.push("/pedidos")}
                    className="cursor-pointer flex items-center gap-2 text-gray-700 px-3 py-2 rounded-full font-bold transition hover:bg-white/15"
                  >
                    <PackageOpen stroke="#ffffff" />
                    <span className="hidden text-white sm:inline text-sm">
                      Mis Pedidos
                    </span>
                  </button>

                  <Link
                    href="/perfil"
                    id="userLoggedMain"
                    className="flex items-center gap-2 text-zinc-800 px-3 py-2 rounded-full font-bold transition hover:bg-white/15"
                  >
                    <User fill="#ffffff" stroke="#ffffff" />
                    <span className="hidden text-white sm:inline text-sm">
                      Hola, {displayName}
                    </span>
                  </Link>
                </div>
              )}

              <button
                onClick={toggleCart}
                className="cursor-pointer flex items-center gap-3 text-white bg-white/15 hover:bg-white/25 px-4 py-2 rounded-full font-bold transition"
              >
                <div className="relative">
                  <ShoppingCart color="#FFFFFF" fill="#FFFFFF" />
                  {cartCount > 0 && (
                    <span
                      id="cartCountBadge"
                      className="absolute -top-2.5 -right-2.5 bg-white text-[#f74d00] text-[11px] font-black min-w-5 h-5 px-1 flex items-center justify-center rounded-full shadow"
                    >
                      {cartCount}
                    </span>
                  )}
                </div>
                <span
                  className="hidden sm:inline text-base"
                  id="cartTotalHeader"
                >
                  $
                  {getCartTotalWithDiscount(userProfile).toLocaleString(
                    "es-AR",
                  )}
                  {qualifiesForFirstBuyDiscount(userProfile) && (
                    <span className="text-green-600 text-xs ml-1">✨</span>
                  )}
                </span>
              </button>
            </div>
          </div>
          <form onSubmit={buscar} className="md:hidden px-3 pb-3">
            {buscador}
          </form>
        </div>
      </div>
      {/* Menú del celular: panel que entra desde la izquierda */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] motion-safe:animate-[fadeIn_200ms_ease-out]"
          />
          <aside className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-gray-50 shadow-2xl flex flex-col motion-safe:animate-[entrarIzquierda_250ms_ease-out]">
            {/* Cabecera: quién es y cerrar */}
            <div className="bg-[#f74d00] px-5 pt-5 pb-6 rounded-br-3xl">
              <div className="flex items-center justify-between mb-5">
                <span className="text-white text-3xl font-black italic leading-none">
                  YA! <span className="not-italic text-lg tracking-tight">MAYORISTA</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                >
                  <X size={20} />
                </button>
              </div>
              {user ? (
                <Link
                  href="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <span className="w-11 h-11 rounded-full bg-white text-[#f74d00] font-black text-lg flex items-center justify-center uppercase">
                    {displayName.charAt(0) || "?"}
                  </span>
                  <span className="text-white leading-tight">
                    <span className="block font-black">Hola, {displayName}</span>
                    <span className="block text-xs text-white/80">Ver mi perfil</span>
                  </span>
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-[#f74d00] font-black text-sm py-2.5 rounded-full"
                  >
                    <LogIn size={16} /> Ingresar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/15 text-white font-black text-sm py-2.5 rounded-full"
                  >
                    <UserPlus size={16} /> Crear cuenta
                  </Link>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
              {/* Navegación */}
              <nav className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                {[
                  { href: "/", icono: House, texto: "Inicio", contador: 0 },
                  { href: "/productos?categoria=SoloOfertas", icono: Tag, texto: "Ofertas", contador: 0 },
                  { href: "/pedidos", icono: PackageOpen, texto: "Mis pedidos", contador: 0 },
                  { href: "/cart", icono: ShoppingCart, texto: "Mi carrito", contador: cartCount },
                ].map(({ href, icono: Icono, texto, contador }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-orange-50 transition"
                  >
                    <span className="w-9 h-9 rounded-xl bg-orange-50 text-[#f74d00] flex items-center justify-center">
                      <Icono size={18} />
                    </span>
                    <span className="flex-1 font-bold text-gray-800">{texto}</span>
                    {contador > 0 && (
                      <span className="bg-[#f74d00] text-white text-xs font-black min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center">
                        {contador}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-gray-300" />
                  </Link>
                ))}
              </nav>

              {/* Rubros */}
              {categories.length > 0 && (
                <div>
                  <h3 className="px-1 mb-2 text-xs font-black uppercase tracking-wider text-gray-400">
                    Productos
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/productos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 rounded-full bg-[#f74d00] text-white text-sm font-bold"
                    >
                      Todos
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/productos?categoria=${encodeURIComponent(cat)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-700 capitalize active:border-[#f74d00] active:text-[#f74d00]"
                      >
                        {String(cat).toLowerCase()}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Contacto */}
              <div>
                <h3 className="px-1 mb-2 text-xs font-black uppercase tracking-wider text-gray-400">
                  Contacto
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <a
                    href="https://wa.me/3425084197"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-bold text-sm shadow-sm"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                  <a
                    href="tel:3425084197"
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 font-bold text-sm shadow-sm"
                  >
                    <Phone size={18} /> Llamar
                  </a>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 text-sm text-gray-600">
                  <p className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#f74d00] shrink-0" />
                    Pedro de Vega 3220, Santa Fe
                  </p>
                  <p className="flex items-start gap-3">
                    <Clock size={18} className="text-[#f74d00] shrink-0" />
                    <span>
                      Lun a Vie 8 a 18 · Sáb 8 a 16
                      <br />
                      Dom 8 a 13
                    </span>
                  </p>
                  <a
                    href="mailto:contacto@yamayorista.com"
                    className="flex items-start gap-3"
                  >
                    <Mail size={18} className="text-[#f74d00] shrink-0" />
                    contacto@yamayorista.com
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      <div>
        <AuthModal />
        <ProfileModal />
      </div>
    </div>
  );
}
