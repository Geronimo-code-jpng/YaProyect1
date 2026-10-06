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

interface ProductsTableProps extends ProductRowHandlers {
  products: AdminProduct[];
}

const num = (v: unknown) => Number(v ?? 0).toLocaleString("es-AR");

export default function ProductsTable({
  products,
  onEdit,
  onFlag,
}: ProductsTableProps) {
  return (
    <div className="hidden md:block min-w-full overflow-x-auto rounded-2xl border border-gray-200">
      <table className=" text-left text-xs">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
          <tr>
            <th className="p-3 font-black">Producto</th>
            <th className="p-3 font-black">Categoría</th>
            <th className="p-3 font-black text-right">Precio</th>
            <th className="p-3 font-black text-center">Stock</th>
            <th className="p-3 font-black">Precio tachado</th>
            <th className="p-3 font-black text-center">Vendidas</th>
            {FLAGS.map((f) => (
              <th key={f} className="p-3 font-black text-center">
                {FLAG_META[f].label}
              </th>
            ))}
            <th className="p-3 font-black text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <tr key={p.Id} className="hover:bg-gray-50/70 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="relative h-11 w-11 shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <Image
                      src={p.Imagen || p.imagen || PLACEHOLDER}
                      alt={p.nombre}
                      fill
                      sizes="44px"
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {p.nombre}
                    </p>
                    <p className="text-xs text-gray-400 tabular-nums">
                      #{p.Id}
                      {!(p.Imagen || p.imagen) && " · sin foto"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="p-3">
                <Badge>{p.Categoria || "—"}</Badge>
                {p.subcategoria && (
                  <p className="text-[11px] text-gray-400 mt-1">{p.subcategoria}</p>
                )}
              </td>
              <td className="p-3 text-right font-black text-gray-800 tabular-nums">
                ${num(p.precio)}
                {tieneUnidad(p) && (
                  <p className="text-[11px] font-medium text-gray-400">
                    ${num(p.precio_unidad)} c/u
                  </p>
                )}
              </td>
              <td className="p-3 text-center">
                {p.publicado === false ? (
                  <Badge tone="danger">Sin publicar</Badge>
                ) : p.Stock ? (
                  <Badge tone="success">En stock</Badge>
                ) : (
                  <Badge tone="danger">Sin stock</Badge>
                )}
                {p.stock_actual != null && (
                  <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                    {num(p.stock_actual)} bulto{Number(p.stock_actual) === 1 ? "" : "s"}
                    {tieneUnidad(p) && p.stock_unidades != null
                      ? ` · ${num(p.stock_unidades)} u.`
                      : ""}
                  </p>
                )}
              </td>
              <td className="p-3">
                {p.Oferta ? (
                  <Badge tone="brand">${p.Oferta}</Badge>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="p-3 text-center tabular-nums">
                {p.unidades_vendidas ? (
                  <span
                    className="font-bold text-gray-700"
                    title={
                      p.ingresos_generados
                        ? `$${Number(p.ingresos_generados).toLocaleString("es-AR")} en pedidos pagados`
                        : undefined
                    }
                  >
                    {p.unidades_vendidas}
                  </span>
                ) : (
                  <span className="text-gray-300">0</span>
                )}
              </td>
              {FLAGS.map((f) => (
                <td key={f} className="p-3 text-center">
                  <Toggle
                    checked={Boolean(p[f])}
                    onChange={(v) => onFlag(p.Id, f, v)}
                    tone={FLAG_META[f].tone}
                    label={FLAG_META[f].label}
                    hideLabel
                  />
                </td>
              ))}
              <td className="p-3">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Pencil}
                    aria-label={`Foto y precio tachado de ${p.nombre}`}
                    title="Foto y precio tachado"
                    onClick={() => onEdit(p.Id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
