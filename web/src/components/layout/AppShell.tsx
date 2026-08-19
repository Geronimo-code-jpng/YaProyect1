"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavBar, Footer } from "./index";
import CartModal from "../cart";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import { CartProvider } from "../../contexts/CartContext";
import { AlertProvider } from "../../contexts/AlertContext";
import { ProductProvider } from "../../contexts/ProductContext";
// Bot del chatbot: comentado hasta tener una GEMINI_API_KEY nueva para este
// proyecto (yaproyect1-web). Descomentar y reemplazar <WhatsAppButton /> por
// <Bot /> más abajo cuando esté configurada.
// import Bot from "./Bot";
import WhatsAppButton from "./WhatsAppButton";

const TITLES: Record<string, string> = {
  "/": "YA MAYORISTA! | Página Principal",
  "/productos": "YA MAYORISTA! | Catálogo Oficial",
  "/admin": "YA MAYORISTA! | Panel Administración",
  "/cart": "YA MAYORISTA! | Mi Carrito",
  "/login": "YA MAYORISTA! | Iniciar Sesión",
  "/register": "YA MAYORISTA! | Crear Cuenta",
  "/pedidos": "YA MAYORISTA! | Mis Pedidos",
  "/perfil": "YA MAYORISTA! | Mi Perfil",
  "/thankyoupage": "YA MAYORISTA! | Gracias por tu compra",
};

function AppContent({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showPromoModal, setShowPromoModal] = useState(true);
  const { openAuthModal, user, userProfile } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/producto/")) {
      document.title = "YA MAYORISTA! | Detalle del Producto";
    } else {
      document.title = TITLES[pathname] || "YA MAYORISTA!";
    }
  }, [pathname]);

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FF6600] rounded-full flex items-center justify-center text-white text-3xl font-black italic mx-auto mb-4 animate-pulse">
            YA
          </div>
          <div className="text-gray-600 font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        id="toastExito"
        className="fixed top-5 right-5 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl transform transition-transform translate-x-[150%] z-99999 flex items-center gap-3 font-bold border-2 border-green-400"
      >
        <i className="fas fa-check-circle text-2xl"></i>
        <span id="toastMsg">¡Operación exitosa!</span>
      </div>

      {showPromoModal && !user && (
        <div
          id="promoModal"
          className="fixed inset-0 bg-black/60 z-99999 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
        >
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl modal-animate relative">
            <button
              onClick={() => setShowPromoModal(false)}
              className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-black text-3xl leading-none"
            >
              &times;
            </button>
            <i className="fas fa-gift text-6xl text-[#FF6600] mb-4"></i>
            <h2 className="text-3xl font-black text-zinc-900 leading-tight mb-2">
              ¡$1.000 OFF!
            </h2>
            <p className="text-gray-600 font-medium mb-6">
              {user
                ? `¡Hola ${userProfile?.nombre || user.email?.split("@")[0]}! Creá tu cuenta gratis ahora y ahorrá $1.000 en tu primera compra superior a $80.000. Solo en envios`
                : "Creá tu cuenta gratis ahora y ahorrá $1.000 en tu primera compra superior a $80.000. Solo en envios"}
            </p>
            <button
              onClick={() => (openAuthModal(), setShowPromoModal(false))}
              className="w-full bg-[#FF6600] text-white text-lg font-black py-4 rounded-xl hover:bg-orange-700 transition shadow-lg"
            >
              {user ? "Ir al Catálogo" : "Crear Mi Cuenta"}
            </button>
            <button
              onClick={() => setShowPromoModal(false)}
              className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600"
            >
              No, gracias.
            </button>
          </div>
        </div>
      )}

      <WhatsAppButton />
      <NavBar />

      {children}

      <Footer />
      <CartModal />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AlertProvider>
      <AuthProvider>
        <CartProvider>
          <ProductProvider>
            <AppContent>{children}</AppContent>
          </ProductProvider>
        </CartProvider>
      </AuthProvider>
    </AlertProvider>
  );
}
