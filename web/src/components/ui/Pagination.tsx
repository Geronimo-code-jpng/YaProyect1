"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import Button from "./Button";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  /** Plural noun for the "N–M de T" / "Por página" labels, e.g. "pedidos". */
  label?: string;
  pageSizes?: readonly number[];
}

/** Compact list of page numbers with `…` gaps around the current page. */
function pageItems(current: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < last - 1) items.push("…");
  items.push(last);
  return items;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  label = "resultados",
  pageSizes = PAGE_SIZES,
}: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <span className="tabular-nums">
          {from}–{to} de {total}
        </span>
        <span className="text-gray-300">·</span>
        <label className="flex items-center gap-1.5">
          <span>Por página</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            aria-label={`${label} por página`}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-1 pl-2 pr-6 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        />
        {pageItems(page, lastPage).map((it, i) =>
          it === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1.5 text-sm text-gray-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={it}
              type="button"
              onClick={() => onPage(it)}
              aria-current={it === page ? "page" : undefined}
              className={clsx(
                "min-w-[32px] rounded-lg px-2 py-1 text-sm font-bold transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                it === page
                  ? "bg-brand text-white"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {it}
            </button>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronRight}
          aria-label="Página siguiente"
          disabled={page >= lastPage}
          onClick={() => onPage(page + 1)}
        />
      </div>
    </div>
  );
}
