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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { fetchProductos } from "../../lib/catalogApi";
import PhraseGroup from "./BucleSlogan";

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
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchProductos();
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
    <div className="sticky top-0 z-40">
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
      <div className="bg-white shadow-sm">
        <div className="relative flex overflow-x-hidden border-b border-gray-200 bg-white md:hidden">
          <div className="flex animate-marquee-reverse whitespace-nowrap">
            <PhraseGroup />
          </div>
        </div>
        <div className="max-w-full h-full mx-auto md:px-20 bg-[#f74d00]">
          <div className="flex flex-wrap md:flex-nowrap items-center md:gap-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center gap-2 text-white px-3 py-2 rounded-full font-bold transition mr-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 cursor-pointer shrink-0 transition"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-4xl font-black italic">
                YA!
              </div>
              <div className="leading-none hidden sm:block">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  MAYORISTA
                </h1>
              </div>
            </Link>

            {/* Navigation Menu - Simple */}
            <nav className="hidden md:flex items-center text-sm font-bold mr-auto gap-2">
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

            <div className="flex items-center order-2 md:order-3 shrink-0 ml-auto md:ml-0">
              {!user ? (
                <Link
                  href="/login"
                  id="btnIngresarMain"
                  className="flex items-center gap-2 border-orange-200 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition"
                >
                  <CircleUserRound className="w-8 h-8" />
                  <span className="hidden sm:inline text-sm">Ingresar</span>
                </Link>
              ) : (
                <div className="flex items-center">
                  <button
                    onClick={() => router.push("/pedidos")}
                    className="cursor-pointer flex items-center gap-2 text-gray-700 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition"
                  >
                    <PackageOpen stroke="#ffffff" />
                    <span className="hidden text-white sm:inline text-sm">
                      Mis Pedidos
                    </span>
                  </button>

                  <Link
                    href="/perfil"
                    id="userLoggedMain"
                    className="flex items-center gap-2 text-zinc-800 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition hover:opacity-80"
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
                className="cursor-pointer flex items-center gap-3 text-white px-5 py-3 rounded-full font-bold transition"
              >
                <div className="relative">
                  <ShoppingCart color="#FFFFFF" fill="#FFFFFF" />
                  <span
                    id="cartCountBadge"
                    className="absolute -top-3 -right-3 bg-red-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border border-black/20"
                  >
                    {cartCount}
                  </span>
                </div>
                <span
                  className="hidden sm:inline ml-1 text-lg"
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
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <div className="fixed left-0 top-0 h-full w-70 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="p-6 border-b bg-[#FF6600]">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-black">Menú</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-gray-200 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* Navigation Links */}
              <div className="space-y-4">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                >
                  Inicio
                </Link>

                <div>
                  <button
                    onClick={() =>
                      setMobileCategoriesOpen(!mobileCategoriesOpen)
                    }
                    className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2 w-full text-left"
                  >
                    <span className="flex items-center gap-2">
                      Productos
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          mobileCategoriesOpen ? "" : "rotate-180"
                        }`}
                      />
                    </span>
                  </button>
                  {mobileCategoriesOpen && categories.length > 0 && (
                    <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-100 pl-4 overflow-hidden transition-all duration-300">
                      <Link
                        key={"llProducts"}
                        href={`/productos?`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm font-medium text-gray-500 hover:text-[#FF6600] transition py-1.5"
                      >
                        Todos los Productos
                      </Link>
                      {categories.map((cat) => (
                        <Link
                          key={cat}
                          href={`/productos?categoria=${encodeURIComponent(cat)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-sm font-medium text-gray-500 hover:text-[#FF6600] transition py-1.5"
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href="/productos?categoria=SoloOfertas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                >
                  <Tag size={20} /> Ofertas
                </Link>

                <Link
                  href="/pedidos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                >
                  <PackageOpen size={20} /> Mis Pedidos
                </Link>
              </div>

              {/* User Actions */}
              <div className="border-t pt-6 space-y-4">
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                    >
                      <CircleUserRound size={20} /> Iniciar Sesión
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                    >
                      Crear Cuenta
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/pedidos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                    >
                      <PackageOpen size={20} /> Mis Pedidos
                    </Link>
                    <Link
                      href="/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                    >
                      <User size={20} /> Mi Perfil
                    </Link>
                  </>
                )}
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-[#FF6600] transition py-2"
                >
                  <ShoppingCart size={20} /> Mi Carrito
                  {cartCount > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-6 space-y-3">
                <h3 className="font-black text-gray-900 mb-4">Contacto</h3>
                <a
                  href="tel:3425084197"
                  className="flex items-center gap-3 text-gray-600 hover:text-[#FF6600] transition"
                >
                  <Phone size={18} />
                  <span>342 508-4197</span>
                </a>
                <a
                  href="https://wa.me/3425084197"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-[#FF6600] transition"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={18} />
                  <span className="text-sm">Pedro de Vega 3220, Santa Fe</span>
                </div>
                <a
                  href="mailto:contacto@yamayorista.com"
                  className="flex items-center gap-3 text-gray-600 hover:text-[#FF6600] transition"
                >
                  <Mail size={18} />
                  <span className="text-sm">contacto@yamayorista.com</span>
                </a>
              </div>

              {/* Business Hours */}
              <div className="border-t pt-6">
                <h3 className="font-black text-gray-900 mb-3">Horarios</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Lunes a Viernes: 8:00 - 18:00</p>
                  <p>Sábados: 8:00 - 16:00</p>
                  <p>Domingos: 8:00 - 13:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div>
        <AuthModal />
        <ProfileModal />
      </div>
    </div>
  );
}
