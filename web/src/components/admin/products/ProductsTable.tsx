"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Toggle from "../../ui/Toggle";
import QuantityStepper from "./QuantityStepper";
import {
  FLAG_META,
  type AdminProduct,
  type ProductFlag,
  type ProductRowHandlers,
} from "./types";

const PLACEHOLDER = "/producto-placeholder.svg";
const FLAGS = Object.keys(FLAG_META) as ProductFlag[];

interface ProductsTableProps extends ProductRowHandlers {
  products: AdminProduct[];
}

export default function ProductsTable({
  products,
  onEdit,
  onRemove,
  onFlag,
  onQuantity,
  onQuantityCommit,
}: ProductsTableProps) {
  return (
    <div className="hidden md:block min-w-full overflow-x-auto rounded-2xl border border-gray-200">
      <table className=" text-left text-xs">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
          <tr>
            <th className="p-3 font-black">Producto</th>
            <th className="p-3 font-black">Categoría</th>
            <th className="p-3 font-black text-right">Precio</th>
            <th className="p-3 font-black text-center">Bulto</th>
            <th className="p-3 font-black text-center">Stock</th>
            <th className="p-3 font-black">Oferta</th>
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
                    </p>
                  </div>
                </div>
              </td>
              <td className="p-3">
                <Badge>{p.Categoria || "—"}</Badge>
              </td>
              <td className="p-3 text-right font-black text-gray-800 tabular-nums">
                ${Number(p.precio || 0).toLocaleString("es-AR")}
              </td>
              <td className="p-3 text-center">
                <QuantityStepper
                  value={p.quantity || 1}
                  onChange={(v) => onQuantity(p.Id, v)}
                  onCommit={() => onQuantityCommit(p.Id)}
                />
              </td>
              <td className="p-3 text-center">
                {p.Stock ? (
                  <Badge tone="success">En stock</Badge>
                ) : (
                  <Badge tone="danger">Sin stock</Badge>
                )}
              </td>
              <td className="p-3">
                {p.Oferta ? (
                  <Badge tone="brand">{p.Oferta}</Badge>
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
                    aria-label={`Editar ${p.nombre}`}
                    onClick={() => onEdit(p.Id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    aria-label={`Eliminar ${p.nombre}`}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onRemove(p.Id)}
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
