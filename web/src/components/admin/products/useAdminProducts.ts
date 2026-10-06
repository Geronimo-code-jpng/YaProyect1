"use client";

import { useCallback, useEffect, useState } from "react";
import { useProducts } from "../../../contexts/ProductContext";
import { updateProductoAdmin, fetchProductoById } from "../../../lib/catalogApi";
import { processProductImageReplacement } from "../../../utils/imageFileHandler";
import type { AdminProduct, ProductFlag, ProductFormValues } from "./types";

type ToastType = "success" | "error" | "info";

interface Options {
  showToast: (message: string, type?: ToastType) => void;
}

// Del catálogo, la página solo edita lo que es de la tienda: la foto, "más
// vendido", "oferta express" y el precio tachado (Oferta). Nombre, precio,
// rubro, stock y unidades los manda el sistema del negocio, y no hay alta ni
// baja de productos desde acá (los crea y los da de baja el sistema).
export function useAdminProducts({ showToast }: Options) {
  const { loadProductsForAdmin } = useProducts();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = (await loadProductsForAdmin()) || [];
      setProducts(list as AdminProduct[]);
    } catch (err) {
      console.error("Error cargando productos:", err);
      showToast("Error al cargar productos", "error");
    } finally {
      setLoading(false);
    }
  }, [loadProductsForAdmin, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const patchLocal = useCallback((id: number, patch: Partial<AdminProduct>) => {
    setProducts((prev) =>
      prev.map((p) => (p.Id === id ? { ...p, ...patch } : p)),
    );
  }, []);

  const updateFlag = useCallback(
    async (id: number, field: ProductFlag, value: boolean) => {
      const prevValue = products.find((p) => p.Id === id)?.[field];
      patchLocal(id, { [field]: value });
      try {
        await updateProductoAdmin(id, { [field]: value });
      } catch (err) {
        console.error(`Error actualizando ${field}:`, err);
        patchLocal(id, { [field]: prevValue });
        showToast("No se pudo actualizar", "error");
      }
    },
    [products, patchLocal, showToast],
  );

  const openEdit = useCallback(async (id: number) => {
    setEditing(null);
    setEditingLoading(true);
    setFormOpen(true);
    try {
      // El admin ve también los productos sin publicar: se sacan de la lista ya cargada
      const fromList = products.find((p) => p.Id === id);
      if (fromList) {
        setEditing(fromList);
      } else {
        const data = await fetchProductoById(id);
        if (data) setEditing(data as AdminProduct);
      }
    } catch (err) {
      console.error("Error cargando producto:", err);
    } finally {
      setEditingLoading(false);
    }
  }, [products]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const save = useCallback(
    async (values: ProductFormValues) => {
      if (!editing) return;
      setSaving(true);
      try {
        const { imageFile, ...rest } = values;
        const payload: Record<string, unknown> = {
          oferta_express: rest.oferta_express,
          mas_vendido: rest.mas_vendido,
          Oferta: rest.Oferta.trim() || null,
        };

        if (imageFile) {
          const result = await processProductImageReplacement(imageFile, editing);
          if (!result.success || !result.imageUrl) {
            throw new Error(result.error || "Error al subir la imagen");
          }
          payload.Imagen = result.imageUrl;
        }

        await updateProductoAdmin(editing.Id, payload);
        showToast("Producto actualizado", "success");

        await load();
        closeForm();
      } catch (err) {
        console.error("Error guardando producto:", err);
        showToast(
          `Error al guardar: ${err instanceof Error ? err.message : "desconocido"}`,
          "error",
        );
      } finally {
        setSaving(false);
      }
    },
    [editing, load, closeForm, showToast],
  );

  return {
    products,
    loading,
    saving,
    formOpen,
    editing,
    editingLoading,
    load,
    updateFlag,
    openEdit,
    closeForm,
    save,
  };
}
