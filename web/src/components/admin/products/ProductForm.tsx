"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { fetchCategorias } from "../../../lib/catalogApi";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import Toggle from "../../ui/Toggle";
import { FLAG_META, type AdminProduct, type ProductFormValues } from "./types";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  loading?: boolean;
  saving?: boolean;
  onSave: (values: ProductFormValues) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type FieldErrors = Partial<Record<"nombre" | "precio" | "quantity" | "Stock" | "Categoria" | "imageFile", string>>;

const emptyValues: ProductFormValues = {
  nombre: "",
  precio: 0,
  Categoria: "",
  Oferta: "",
  Stock: true,
  quantity: 1,
  oferta_express: false,
  mas_vendido: false,
  solo_bulto: false,
  imageFile: null,
};

export default function ProductForm({
  open,
  onClose,
  product,
  loading = false,
  saving = false,
  onSave,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [categorias, setCategorias] = useState<{ id: string; categoria: string }[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(product);
  const existingImage = product?.Imagen || product?.imagen || null;

  useEffect(() => {
    if (!open) return;
    fetchCategorias()
      .then((data) =>
        setCategorias(
          [...data].sort((a, b) => a.categoria.localeCompare(b.categoria)),
        ),
      )
      .catch(() => setCategorias([]));
  }, [open]);

  // Sync form state whenever the target product (or open) changes.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (product) {
      setValues({
        nombre: product.nombre ?? "",
        precio: Number(product.precio) || 0,
        Categoria: product.Categoria ?? "",
        Oferta: product.Oferta ?? "",
        Stock: product.Stock ?? true,
        quantity: product.quantity ?? 1,
        oferta_express: product.oferta_express ?? false,
        mas_vendido: product.mas_vendido ?? false,
        solo_bulto: product.solo_bulto ?? false,
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
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      set("imageFile", null);
      setPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, imageFile: "El archivo debe ser una imagen." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((p) => ({ ...p, imageFile: "La imagen no puede superar 5 MB." }));
      return;
    }
    set("imageFile", file);
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!values.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!(values.precio > 0)) next.precio = "El precio debe ser mayor a 0.";
    if (!values.quantity || values.quantity < 1)
      next.quantity = "Debe ser 1 o más.";
    if (!values.Categoria.trim()) next.Categoria = "Elegí una categoría.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...values,
      nombre: values.nombre.trim(),
      precio: Number(values.precio),
      quantity: Number(values.quantity) || 1,
      Oferta: values.Oferta.trim(),
    });
  };

  const shownImage = useMemo(
    () => preview || existingImage,
    [preview, existingImage],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-form"
            fullWidth
            loading={saving}
          >
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      }
    >
      {loading ? (
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
          <div className="md:col-span-2">
            <Input
              label="Nombre del producto *"
              name="nombre"
              value={values.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Coca Cola 2.25L"
              error={errors.nombre}
            />
          </div>

          <Input
            label="Precio *"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            value={values.precio || ""}
            onChange={(e) => set("precio", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            error={errors.precio}
          />

          <Input
            label="Cantidad por bulto *"
            name="quantity"
            type="number"
            min="1"
            value={values.quantity || ""}
            onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
            placeholder="1"
            hint="¿Cuántas unidades trae el bulto?"
            error={errors.quantity}
          />

          <Select
            label="Stock *"
            name="Stock"
            value={values.Stock ? "true" : "false"}
            onChange={(e) => set("Stock", e.target.value === "true")}
          >
            <option value="true">Hay stock</option>
            <option value="false">Sin stock</option>
          </Select>

          <Select
            label="Categoría *"
            name="Categoria"
            value={values.Categoria}
            onChange={(e) => set("Categoria", e.target.value)}
            error={errors.Categoria}
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.categoria}>
                {c.categoria}
              </option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Input
              label="Texto de oferta (opcional)"
              name="Oferta"
              value={values.Oferta}
              onChange={(e) => set("Oferta", e.target.value)}
              placeholder="Ej: 500"
              hint="Pesos de descuento que se restan del precio del bulto."
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
                {errors.imageFile && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {errors.imageFile}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(
              Object.keys(FLAG_META) as (keyof typeof FLAG_META)[]
            ).map((flag) => (
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
