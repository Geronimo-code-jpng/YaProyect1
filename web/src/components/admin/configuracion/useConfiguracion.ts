"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchConfiguracion,
  updateConfiguracion,
  fetchCategorias,
  createCategoriaAdmin,
  deleteCategoriaAdmin,
} from "../../../lib/catalogApi";

type ToastType = "success" | "error" | "info";

interface Options {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    tone?: "brand" | "danger",
  ) => void;
}

export interface BankInfo {
  banco: string;
  titular: string;
  alias: string;
  cbu: string;
}

const EMPTY_BANK: BankInfo = { banco: "", titular: "", alias: "", cbu: "" };
type Categoria = { id: string; categoria: string };

export function useConfiguracion({ showToast, showConfirm }: Options) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [envioSaved, setEnvioSaved] = useState<number>(0);
  const [envio, setEnvio] = useState("0");
  const [envioSaving, setEnvioSaving] = useState(false);

  const [bankSaved, setBankSaved] = useState<BankInfo>(EMPTY_BANK);
  const [bank, setBank] = useState<BankInfo>(EMPTY_BANK);
  const [bankSaving, setBankSaving] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [config, cats] = await Promise.all([
          fetchConfiguracion(),
          fetchCategorias(),
        ]);
        if (!alive) return;
        if (config) {
          const precio = Number(config.precio_envio) || 0;
          setEnvioSaved(precio);
          setEnvio(String(precio));
          const b: BankInfo = {
            banco: config.banco || "",
            titular: config.titular || "",
            alias: config.alias || "",
            cbu: config.cbu || "",
          };
          setBankSaved(b);
          setBank(b);
        }
        setCategorias(
          [...cats].sort((a, b) => a.categoria.localeCompare(b.categoria)),
        );
      } catch (err) {
        console.error("Error cargando configuración:", err);
        if (alive) setError("No se pudo cargar la configuración.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const envioDirty = envio.trim() !== String(envioSaved);
  const bankDirty = (Object.keys(bank) as (keyof BankInfo)[]).some(
    (k) => bank[k].trim() !== bankSaved[k],
  );

  const saveEnvio = useCallback(async () => {
    const parsed = Number(envio);
    if (!Number.isFinite(parsed) || parsed < 0) {
      showToast("Ingresá un precio válido", "error");
      return;
    }
    const value = Math.round(parsed);
    setEnvioSaving(true);
    try {
      await updateConfiguracion({ precio_envio: value });
      setEnvioSaved(value);
      setEnvio(String(value));
      showToast("Precio de envío actualizado", "success");
    } catch (err) {
      console.error("Error guardando precio de envío:", err);
      showToast("Error al guardar el precio de envío", "error");
    } finally {
      setEnvioSaving(false);
    }
  }, [envio, showToast]);

  const saveBank = useCallback(async () => {
    setBankSaving(true);
    try {
      const trimmed: BankInfo = {
        banco: bank.banco.trim(),
        titular: bank.titular.trim(),
        alias: bank.alias.trim(),
        cbu: bank.cbu.trim(),
      };
      await updateConfiguracion(trimmed);
      setBankSaved(trimmed);
      setBank(trimmed);
      showToast("Datos bancarios guardados", "success");
    } catch (err) {
      console.error("Error guardando datos bancarios:", err);
      showToast("Error al guardar datos bancarios", "error");
    } finally {
      setBankSaving(false);
    }
  }, [bank, showToast]);

  const reloadCategorias = useCallback(async () => {
    const cats = await fetchCategorias();
    setCategorias(
      [...cats].sort((a, b) => a.categoria.localeCompare(b.categoria)),
    );
  }, []);

  const addCategoria = useCallback(async () => {
    const nombre = nuevaCategoria.trim();
    if (!nombre) {
      showToast("Ingresá un nombre para la categoría", "error");
      return;
    }
    setCatBusy(true);
    try {
      const result = await createCategoriaAdmin(nombre);
      if (!result.success) {
        showToast(`Error al agregar categoría: ${result.error}`, "error");
        return;
      }
      setNuevaCategoria("");
      await reloadCategorias();
      showToast(`Categoría "${nombre}" agregada`, "success");
    } catch (err) {
      console.error("Error al agregar categoría:", err);
      showToast("Error al agregar categoría", "error");
    } finally {
      setCatBusy(false);
    }
  }, [nuevaCategoria, reloadCategorias, showToast]);

  const removeCategoria = useCallback(
    (id: string, nombre: string) => {
      showConfirm(
        `¿Eliminar la categoría "${nombre}"?`,
        async () => {
          setRemoving(id);
          try {
            await deleteCategoriaAdmin(id);
            await reloadCategorias();
            showToast(`Categoría "${nombre}" eliminada`, "success");
          } catch (err) {
            console.error("Error al eliminar categoría:", err);
            showToast("Error al eliminar categoría", "error");
          } finally {
            setRemoving(null);
          }
        },
        "danger",
      );
    },
    [reloadCategorias, showConfirm, showToast],
  );

  return {
    loading,
    error,
    // envío
    envio,
    setEnvio,
    envioSaved,
    envioDirty,
    envioSaving,
    saveEnvio,
    // banco
    bank,
    setBank,
    bankDirty,
    bankSaving,
    saveBank,
    // categorías
    categorias,
    nuevaCategoria,
    setNuevaCategoria,
    catBusy,
    removing,
    addCategoria,
    removeCategoria,
  };
}
