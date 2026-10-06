"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Toggle from "../../ui/Toggle";
import { FLAG_META, type AdminProduct, type ProductFlag, type ProductFormValues } from "./types";
import { tieneUnidad } from "../../../lib/presentaciones";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  loading?: boolean;
  saving?: boolean;
  onSave: (values: ProductFormValues) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const FLAGS = Object.keys(FLAG_META) as ProductFlag[];

const emptyValues: ProductFormValues = {
  Oferta: "",
  oferta_express: false,
  mas_vendido: false,
  imageFile: null,
};

const plata = (n: unknown) => `$${Number(n ?? 0).toLocaleString("es-AR")}`;

// Del producto, desde la página solo se cargan la foto, el precio tachado y las
// marcas. Lo demás (nombre, precio, rubro, stock, unidades) lo maneja el
// sistema del negocio: se muestra, pero no se edita.
export default function ProductForm({
  open,
  onClose,
  product,
  loading = false,
  saving = false,
  onSave,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(emptyValues);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingImage = product?.Imagen || product?.imagen || null;

  // Sync form state whenever the target product (or open) changes.
  useEffect(() => {
    if (!open) return;
    setImageError(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (product) {
      setValues({
        Oferta: product.Oferta ?? "",
        oferta_express: product.oferta_express ?? false,
        mas_vendido: product.mas_vendido ?? false,
        imageFile: null,
      });
    } else {
      setValues(emptyValues);
    }
  }, [product, open]);

  useEffect(() => {
    const file = values.imageFile;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [values.imageFile]);

  const set = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageError(null);
    if (!file) {
      set("imageFile", null);
      setPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("La imagen no puede superar 5 MB.");
      return;
    }
    set("imageFile", file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...values, Oferta: values.Oferta.trim() });
  };

  const shownImage = useMemo(
    () => preview || existingImage,
    [preview, existingImage],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Foto y precio tachado"
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="product-form" fullWidth loading={saving} disabled={!product}>
            Guardar cambios
          </Button>
        </div>
      }
    >
      {loading || !product ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 size={32} className="animate-spin text-brand mb-3" />
          <p className="font-bold">Cargando producto…</p>
        </div>
      ) : (
        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Lo que manda el sistema: solo se muestra */}
          <div className="md:col-span-2 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              Lo maneja el sistema del negocio
            </p>
            <p className="font-black text-gray-800">{product.nombre}</p>
            <p className="text-sm text-gray-500">
              #{product.Id} · {product.Categoria || "sin categoría"}
              {product.subcategoria ? ` · ${product.subcategoria}` : ""}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Bulto {plata(product.precio)}
              {tieneUnidad(product) && ` · Unidad ${plata(product.precio_unidad)}`}
              {product.stock_actual != null &&
                ` · Stock: ${Number(product.stock_actual).toLocaleString("es-AR")} bulto(s)${
                  tieneUnidad(product) && product.stock_unidades != null
                    ? ` y ${Number(product.stock_unidades).toLocaleString("es-AR")} unidades`
                    : ""
                }`}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Para cambiar el nombre, el precio, el rubro o el stock, se hace en el sistema:
              la tienda se actualiza sola.
            </p>
          </div>

          <div className="md:col-span-2">
            <Input
              label="Precio tachado (opcional)"
              name="Oferta"
              value={values.Oferta}
              onChange={(e) => set("Oferta", e.target.value)}
              placeholder="Ej: 500"
              hint="Pesos que se suman al precio del bulto para mostrarlo tachado (el precio de lista de antes)."
            />
          </div>

          {/* Imagen */}
          <div className="md:col-span-2">
            <span className="block text-sm font-bold text-gray-700 mb-1.5">
              Imagen del producto
            </span>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                {shownImage ? (
                  <Image
                    src={shownImage}
                    alt="Vista previa"
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[11px] text-gray-400 font-medium text-center px-2">
                    Sin imagen
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                  id="product-image"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {shownImage ? "Cambiar imagen" : "Subir imagen"}
                </Button>
                <p className="text-xs text-gray-500 mt-1.5">
                  JPG, PNG o WebP · máx. 5 MB. Se optimiza y convierte a WebP en
                  el servidor.
                </p>
                {values.imageFile && (
                  <p className="text-xs text-green-600 font-medium mt-1 truncate">
                    {values.imageFile.name}
                  </p>
                )}
                {imageError && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {imageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Marcas de la tienda */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {FLAGS.map((flag) => (
              <label
                key={flag}
                className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 cursor-pointer"
              >
                <Toggle
                  checked={values[flag]}
                  onChange={(v) => set(flag, v)}
                  tone={FLAG_META[flag].tone}
                  label={FLAG_META[flag].label}
                />
              </label>
            ))}
          </div>
        </form>
      )}
    </Modal>
  );
}
