"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProducts } from "../../../contexts/ProductContext";
import {
  createProductoAdmin,
  updateProductoAdmin,
  deleteProductoAdmin,
  fetchProductoById,
} from "../../../lib/catalogApi";
import { processProductImageReplacement } from "../../../utils/imageFileHandler";
import type { AdminProduct, ProductFlag, ProductFormValues } from "./types";

type ToastType = "success" | "error" | "info";

interface Options {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const QUANTITY_COMMIT_DELAY = 700;

export function useAdminProducts({ showToast, showConfirm }: Options) {
  const { loadProductsForAdmin } = useProducts();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);

  const quantityTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

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
    const timers = quantityTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
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

  /** Optimistic local update; the PATCH is debounced so typing/stepping fires once. */
  const setQuantity = useCallback(
    (id: number, quantity: number) => {
      const safe = Number.isFinite(quantity) && quantity >= 1 ? quantity : 1;
      patchLocal(id, { quantity: safe });

      const timers = quantityTimers.current;
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);

      timers.set(
        id,
        setTimeout(async () => {
          timers.delete(id);
          try {
            await updateProductoAdmin(id, { quantity: safe });
            showToast("Cantidad por bulto actualizada", "success");
          } catch (err) {
            console.error("Error actualizando cantidad:", err);
            showToast("Error al actualizar la cantidad", "error");
          }
        }, QUANTITY_COMMIT_DELAY),
      );
    },
    [patchLocal, showToast],
  );

  /** Flush a pending quantity PATCH immediately (e.g. on input blur). */
  const flushQuantity = useCallback(
    async (id: number) => {
      const timers = quantityTimers.current;
      const existing = timers.get(id);
      if (!existing) return;
      clearTimeout(existing);
      timers.delete(id);
      const quantity = products.find((p) => p.Id === id)?.quantity ?? 1;
      try {
        await updateProductoAdmin(id, { quantity });
        showToast("Cantidad por bulto actualizada", "success");
      } catch (err) {
        console.error("Error actualizando cantidad:", err);
        showToast("Error al actualizar la cantidad", "error");
      }
    },
    [products, showToast],
  );

  const openNew = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback(async (id: number) => {
    setEditing(null);
    setEditingLoading(true);
    setFormOpen(true);
    try {
      const data = await fetchProductoById(id);
      if (data) setEditing(data as AdminProduct);
    } catch (err) {
      console.error("Error cargando producto:", err);
    } finally {
      setEditingLoading(false);
    }
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const save = useCallback(
    async (values: ProductFormValues) => {
      setSaving(true);
      try {
        const { imageFile, ...rest } = values;
        const payload: Record<string, unknown> = {
          ...rest,
          quantity: rest.quantity || 1,
          Oferta: rest.Oferta.trim() || null,
        };

        if (editing) {
          // Keep the existing image unless a new one is uploaded below.
          const currentImage = editing.Imagen || editing.imagen;
          if (currentImage) payload.Imagen = currentImage;

          if (imageFile) {
            const result = await processProductImageReplacement(
              imageFile,
              editing,
            );
            if (!result.success || !result.imageUrl) {
              throw new Error(result.error || "Error al subir la imagen");
            }
            payload.Imagen = result.imageUrl;
          }

          await updateProductoAdmin(editing.Id, payload);
          showToast("Producto actualizado", "success");
        } else {
          const created = (await createProductoAdmin(payload)) as AdminProduct;

          if (imageFile && created?.Id) {
            const result = await processProductImageReplacement(
              imageFile,
              created,
            );
            if (result.success && result.imageUrl) {
              await updateProductoAdmin(created.Id, {
                Imagen: result.imageUrl,
              });
            } else {
              showToast(
                "Producto creado, pero falló la carga de la imagen",
                "error",
              );
            }
          }
          showToast("Producto creado", "success");
        }

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

  const remove = useCallback(
    (id: number) => {
      showConfirm(
        "¿Eliminar este producto? Esta acción no se puede deshacer.",
        async () => {
          try {
            await deleteProductoAdmin(id);
            setProducts((prev) => prev.filter((p) => p.Id !== id));
            showToast("Producto eliminado", "success");
          } catch (err) {
            console.error("Error eliminando producto:", err);
            showToast("Error al eliminar el producto", "error");
          }
        },
      );
    },
    [showConfirm, showToast],
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
    setQuantity,
    flushQuantity,
    openNew,
    openEdit,
    closeForm,
    save,
    remove,
  };
}
