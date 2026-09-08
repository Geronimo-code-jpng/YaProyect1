"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, AlertTriangle } from "lucide-react";
import { fetchPerfilById } from "../../lib/catalogApi";
import { Button } from "../ui";
import { ProductsTab } from "./products";
import { PedidosTab } from "./pedidos";
import { ConfiguracionTab } from "./configuracion";
import ClientesTab from "./ClientesTab";
import ConfirmDialog from "./ConfirmDialog";
import Toast from "./Toast";

type ToastState = { message: string; type: "success" | "error" | "info" } | null;
type ConfirmState = {
  message: string;
  tone: "brand" | "danger";
  onConfirm: () => void;
} | null;

const SESSION_MAX_HOURS = 24;
const TABS = [
  ["pedidos", "Pedidos"],
  ["productos", "Productos"],
  ["configuracion", "Configuración"],
  ["clientes", "Clientes"],
] as const;
type TabKey = (typeof TABS)[number][0];

function readTabFromUrl(): TabKey {
  if (typeof window === "undefined") return "pedidos";
  const t = new URLSearchParams(window.location.search).get("tab");
  return TABS.some(([k]) => k === t) ? (t as TabKey) : "pedidos";
}

export default function AdminPanel() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pedidos");
  const [toast, setToast] = useState<ToastState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") =>
      setToast({ message, type }),
    [],
  );

  const showConfirm = useCallback(
    (message: string, onConfirm: () => void, tone: "brand" | "danger" = "brand") =>
      setConfirm({
        message,
        tone,
        onConfirm: () => {
          setConfirm(null);
          onConfirm();
        },
      }),
    [],
  );

  const changeTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = tab === "pedidos" ? "/admin" : `/admin?tab=${tab}`;
      window.history.replaceState(null, "", url);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("userSession");
    router.replace("/");
  }, [router]);

  useEffect(() => {
    setActiveTab(readTabFromUrl());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = localStorage.getItem("userSession");
        if (!stored) return router.replace("/");

        const session = JSON.parse(stored);
        const hours =
          (Date.now() - new Date(session.loginTime).getTime()) / 3_600_000;
        if (hours > SESSION_MAX_HOURS || !session.isLoggedIn) {
          localStorage.removeItem("userSession");
          return router.replace("/");
        }

        const perfil = await fetchPerfilById(session.id);
        if (cancelled) return;

        if (!perfil || perfil.rol !== "admin") {
          localStorage.removeItem("userSession");
          return router.replace("/");
        }

        setCurrentEmail(session.email || "");
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Error verificando admin:", err);
        setAuthError("No se pudo verificar la sesión. Reintentá.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center text-gray-400">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 rounded-full border-4 border-brand border-t-transparent animate-spin" />
          <p className="font-bold">Verificando credenciales…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle size={40} className="mx-auto mb-3 text-red-500" />
          <p className="font-black text-lg text-red-600">
            No se pudo abrir el panel
          </p>
          <p className="text-gray-500 mt-1 text-sm">{authError}</p>
          <Button
            className="mt-5"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          tone={confirm.tone}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <header className="bg-zinc-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand rounded-xl grid place-items-center text-white text-xl font-black italic">
              YA
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                Panel <span className="text-brand">Admin</span>
              </h1>
              <p className="text-xs text-gray-400 font-medium">{currentEmail}</p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={logout}
          >
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8" role="tablist" aria-label="Secciones">
            {TABS.map(([tab, label]) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => changeTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition cursor-pointer ${
                  activeTab === tab
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "pedidos" && (
          <PedidosTab showToast={showToast} showConfirm={showConfirm} />
        )}
        {activeTab === "productos" && (
          <ProductsTab showToast={showToast} showConfirm={showConfirm} />
        )}
        {activeTab === "configuracion" && (
          <ConfiguracionTab showToast={showToast} showConfirm={showConfirm} />
        )}
        {activeTab === "clientes" && <ClientesTab />}
      </main>
    </div>
  );
}
