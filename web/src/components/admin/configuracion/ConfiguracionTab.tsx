"use client";

import { useConfiguracion } from "./useConfiguracion";
import ShippingCard from "./ShippingCard";
import BankCard from "./BankCard";
import CategoriesCard from "./CategoriesCard";

type ToastType = "success" | "error" | "info";

interface ConfiguracionTabProps {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    tone?: "brand" | "danger",
  ) => void;
}

export default function ConfiguracionTab({
  showToast,
  showConfirm,
}: ConfiguracionTabProps) {
  const c = useConfiguracion({ showToast, showConfirm });

  if (c.loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        <p className="font-bold">Cargando configuración…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-zinc-800">Configuración</h2>

      {c.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {c.error}
        </div>
      )}

      <ShippingCard
        value={c.envio}
        onChange={c.setEnvio}
        saved={c.envioSaved}
        dirty={c.envioDirty}
        saving={c.envioSaving}
        onSave={c.saveEnvio}
      />

      <BankCard
        value={c.bank}
        onChange={c.setBank}
        dirty={c.bankDirty}
        saving={c.bankSaving}
        onSave={c.saveBank}
      />

      <CategoriesCard
        categorias={c.categorias}
        nueva={c.nuevaCategoria}
        onNueva={c.setNuevaCategoria}
        busy={c.catBusy}
        removing={c.removing}
        onAdd={c.addCategoria}
        onRemove={c.removeCategoria}
      />
    </div>
  );
}
