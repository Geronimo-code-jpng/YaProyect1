"use client";

import { Truck, Save } from "lucide-react";
import { Card, Input, Button } from "../../ui";
import { formatMoneda } from "../lib";

interface ShippingCardProps {
  value: string;
  onChange: (v: string) => void;
  saved: number;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export default function ShippingCard({
  value,
  onChange,
  saved,
  dirty,
  saving,
  onSave,
}: ShippingCardProps) {
  return (
    <Card
      header={
        <span className="flex items-center gap-2">
          <Truck size={18} className="text-brand" />
          Precio de envío
        </span>
      }
    >
      <div className="space-y-4 max-w-sm">
        <div>
          <span className="block text-sm font-bold text-gray-700 mb-1">
            Precio vigente
          </span>
          <span className="text-2xl font-black text-gray-900 tabular-nums">
            {formatMoneda(saved)}
          </span>
        </div>
        <Input
          label="Nuevo precio de envío"
          type="number"
          min="0"
          step="100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          hint="Afecta a los pedidos nuevos hechos desde la web."
        />
        <Button
          icon={Save}
          loading={saving}
          disabled={!dirty}
          onClick={onSave}
        >
          Actualizar precio
        </Button>
      </div>
    </Card>
  );
}
