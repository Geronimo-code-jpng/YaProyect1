"use client";

import { RefreshCw, Search } from "lucide-react";
import clsx from "clsx";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import {
  FLAG_META,
  type ProductFlag,
  type SortKey,
  type StockFilter,
} from "./types";

interface ProductsToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  categories: string[];
  stock: StockFilter;
  onStock: (v: StockFilter) => void;
  flag: ProductFlag | "todos" | "sin_foto";
  onFlag: (v: ProductFlag | "todos" | "sin_foto") => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  total: number;
  shown: number;
  loading: boolean;
  onRefresh: () => void;
}

const FLAG_TABS: { value: ProductFlag | "todos" | "sin_foto"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "oferta_express", label: FLAG_META.oferta_express.label },
  { value: "mas_vendido", label: FLAG_META.mas_vendido.label },
  // Los productos nuevos llegan del sistema sin foto: es lo que hay que cargar acá
  { value: "sin_foto", label: "Sin foto" },
];

export default function ProductsToolbar({
  search,
  onSearch,
  category,
  onCategory,
  categories,
  stock,
  onStock,
  flag,
  onFlag,
  sort,
  onSort,
  total,
  shown,
  loading,
  onRefresh,
}: ProductsToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-zinc-800">Productos</h2>
          <p className="text-sm text-gray-500 font-medium">
            {shown === total
              ? `${total} producto${total !== 1 ? "s" : ""}`
              : `${shown} de ${total} productos`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            El catálogo, el precio y el stock los maneja el sistema del negocio.
            Desde acá se cargan la foto, el precio tachado y las marcas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={onRefresh}
            loading={loading}
          >
            Refrescar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          icon={Search}
          placeholder="Buscar por nombre, categoría o ID…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <Select
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={stock}
          onChange={(e) => onStock(e.target.value as StockFilter)}
          aria-label="Filtrar por stock"
        >
          <option value="todos">Stock: todos</option>
          <option value="con">Con stock</option>
          <option value="sin">Sin stock</option>
        </Select>
        <Select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          aria-label="Ordenar"
        >
          <option value="stock">Orden: stock y nombre</option>
          <option value="vendidos">Más vendidos (ventas reales)</option>
          <option value="nombre">Nombre (A–Z)</option>
          <option value="precio-asc">Precio (menor a mayor)</option>
          <option value="precio-desc">Precio (mayor a menor)</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {FLAG_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onFlag(t.value)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              flag === t.value
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
