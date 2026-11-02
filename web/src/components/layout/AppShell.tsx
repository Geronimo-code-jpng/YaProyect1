"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavBar, Footer } from "./index";
import CartModal from "../cart";
import { AuthProvider } from "../../contexts/AuthContext";
import { CartProvider } from "../../contexts/CartContext";
import { AlertProvider } from "../../contexts/AlertContext";
import { ProductProvider } from "../../contexts/ProductContext";
// Bot del chatbot: comentado hasta tener una GEMINI_API_KEY nueva para este
// proyecto (yaproyect1-web). Descomentar y reemplazar <WhatsAppButton /> por
// <Bot /> más abajo cuando esté configurada.
// import Bot from "./Bot";
import WhatsAppButton from "./WhatsAppButton";
import { Nieve } from "./Navidad";

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
  "/completar-perfil": "YA MAYORISTA! | Completá tu perfil",
};

function AppContent({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
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

      <Nieve />
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
