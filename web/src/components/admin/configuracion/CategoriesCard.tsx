"use client";

import { Tags, Plus, X } from "lucide-react";
import { Card, Input, Button } from "../../ui";

type Categoria = { id: string; categoria: string };

interface CategoriesCardProps {
  categorias: Categoria[];
  nueva: string;
  onNueva: (v: string) => void;
  busy: boolean;
  removing: string | null;
  onAdd: () => void;
  onRemove: (id: string, nombre: string) => void;
}

export default function CategoriesCard({
  categorias,
  nueva,
  onNueva,
  busy,
  removing,
  onAdd,
  onRemove,
}: CategoriesCardProps) {
  return (
    <Card
      header={
        <span className="flex items-center gap-2">
          <Tags size={18} className="text-brand" />
          Categorías
        </span>
      }
    >
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-end gap-3">
          <Input
            label="Nueva categoría"
            value={nueva}
            onChange={(e) => onNueva(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAdd();
            }}
            placeholder="ej: Bebidas"
          />
          <Button icon={Plus} loading={busy} onClick={onAdd}>
            Agregar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categorias.length === 0 && (
            <p className="text-sm text-gray-400 font-medium">
              No hay categorías todavía
            </p>
          )}
          {categorias.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 bg-gray-100 pl-3 pr-2 py-1.5 rounded-lg text-sm font-bold text-gray-700"
            >
              {cat.categoria}
              <button
                type="button"
                onClick={() => onRemove(cat.id, cat.categoria)}
                disabled={removing === cat.id}
                aria-label={`Eliminar ${cat.categoria}`}
                className="text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
