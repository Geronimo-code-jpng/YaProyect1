"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Toggle from "../../ui/Toggle";
import {
  FLAG_META,
  type AdminProduct,
  type ProductFlag,
  type ProductRowHandlers,
} from "./types";
import { tieneUnidad } from "../../../lib/presentaciones";

const PLACEHOLDER = "/producto-placeholder.svg";
const FLAGS = Object.keys(FLAG_META) as ProductFlag[];

interface ProductListProps extends ProductRowHandlers {
  products: AdminProduct[];
}

export default function ProductList({
  products,
  onEdit,
  onFlag,
}: ProductListProps) {
  return (
    <div className="md:hidden space-y-3">
      {products.map((p) => (
        <div
          key={p.Id}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
        >
          <div className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
              <Image
                src={p.Imagen || p.imagen || PLACEHOLDER}
                alt={p.nombre}
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-800 leading-tight">{p.nombre}</p>
              <p className="text-xs text-gray-400 tabular-nums mb-1">
                #{p.Id}
                {!(p.Imagen || p.imagen) && " · sin foto"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge>{p.Categoria || "—"}</Badge>
                {p.publicado === false ? (
                  <Badge tone="danger">Sin publicar</Badge>
                ) : p.Stock ? (
                  <Badge tone="success">En stock</Badge>
                ) : (
                  <Badge tone="danger">Sin stock</Badge>
                )}
                {p.Oferta && <Badge tone="brand">${p.Oferta}</Badge>}
              </div>
            </div>
            <p className="font-black text-gray-800 tabular-nums whitespace-nowrap text-right">
              ${Number(p.precio || 0).toLocaleString("es-AR")}
              {tieneUnidad(p) && (
                <span className="block text-[11px] font-medium text-gray-400">
                  ${Number(p.precio_unidad).toLocaleString("es-AR")} c/u
                </span>
              )}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">
              Unidades vendidas
            </span>
            <span className="text-sm font-black text-gray-700 tabular-nums">
              {p.unidades_vendidas || 0}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3">
            {FLAGS.map((f) => (
              <Toggle
                key={f}
                checked={Boolean(p[f])}
                onChange={(v) => onFlag(p.Id, f, v)}
                tone={FLAG_META[f].tone}
                label={FLAG_META[f].label}
              />
            ))}
          </div>

          <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
            <Button
              variant="secondary"
              size="sm"
              icon={Pencil}
              fullWidth
              onClick={() => onEdit(p.Id)}
            >
              Foto y precio tachado
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
