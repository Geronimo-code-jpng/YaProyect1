"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { PackageOpen } from "lucide-react";
import { useAdminProducts } from "./useAdminProducts";
import ProductsToolbar from "./ProductsToolbar";
import ProductsTable from "./ProductsTable";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";
import ProductsPagination, { PAGE_SIZES } from "./ProductsPagination";
import type { ProductFlag, SortKey, StockFilter } from "./types";

type ToastType = "success" | "error" | "info";

interface ProductsTabProps {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    tone?: "brand" | "danger",
  ) => void;
}

export default function ProductsTab({
  showToast,
  showConfirm,
}: ProductsTabProps) {
  const {
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
  } = useAdminProducts({ showToast, showConfirm });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState<StockFilter>("todos");
  const [flag, setFlag] = useState<ProductFlag | "todos">("todos");
  const [sort, setSort] = useState<SortKey>("stock");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);

  const deferredSearch = useDeferredValue(search);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.Categoria).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  // El tab "Más Vendido" muestra los best sellers REALES (unidades en pedidos
  // pagados) además de los fijados a mano con el flag `mas_vendido`. Y al
  // entrar a ese tab, si el orden sigue en el default, se ordena por ventas.
  const effectiveSort: SortKey =
    flag === "mas_vendido" && sort === "stock" ? "vendidos" : sort;

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    let list = products.filter((p) => {
      if (
        q &&
        !String(p.Id).includes(q) &&
        !(p.nombre || "").toLowerCase().includes(q) &&
        !(p.Categoria || "").toLowerCase().includes(q)
      )
        return false;
      if (category && p.Categoria !== category) return false;
      if (stock === "con" && !p.Stock) return false;
      if (stock === "sin" && p.Stock) return false;
      if (flag === "mas_vendido") {
        if (!p.mas_vendido && (p.unidades_vendidas || 0) === 0) return false;
      } else if (flag !== "todos" && !p[flag]) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (effectiveSort) {
        case "nombre":
          return (a.nombre || "").localeCompare(b.nombre || "");
        case "precio-asc":
          return (a.precio || 0) - (b.precio || 0);
        case "precio-desc":
          return (b.precio || 0) - (a.precio || 0);
        case "vendidos":
          return (
            (b.unidades_vendidas || 0) - (a.unidades_vendidas || 0) ||
            (a.nombre || "").localeCompare(b.nombre || "")
          );
        default:
          // stock first, then name
          return (
            Number(b.Stock) - Number(a.Stock) ||
            (a.nombre || "").localeCompare(b.nombre || "")
          );
      }
    });
    return list;
  }, [products, deferredSearch, category, stock, flag, effectiveSort]);

  // Reset to the first page whenever the filters or page size change.
  const filterKey = `${deferredSearch}|${category}|${stock}|${flag}|${effectiveSort}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const rowHandlers = {
    onEdit: openEdit,
    onRemove: remove,
    onFlag: updateFlag,
    onQuantity: setQuantity,
    onQuantityCommit: flushQuantity,
  };

  return (
    <div className="space-y-5">
      <ProductsToolbar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        categories={categories}
        stock={stock}
        onStock={setStock}
        flag={flag}
        onFlag={setFlag}
        sort={sort}
        onSort={setSort}
        total={products.length}
        shown={filtered.length}
        loading={loading}
        onNew={openNew}
        onRefresh={load}
      />

      {loading && products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
          <p className="font-bold">Cargando productos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <PackageOpen size={48} className="mx-auto mb-3" />
          <p className="font-bold text-lg">
            {products.length === 0
              ? "No hay productos"
              : "No hay productos que coincidan con el filtro"}
          </p>
        </div>
      ) : (
        <>
          <ProductsTable products={paged} {...rowHandlers} />
          <ProductList products={paged} {...rowHandlers} />
          <ProductsPagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </>
      )}

      <ProductForm
        open={formOpen}
        onClose={closeForm}
        product={editing}
        loading={editingLoading}
        saving={saving}
        onSave={save}
      />
    </div>
  );
}
