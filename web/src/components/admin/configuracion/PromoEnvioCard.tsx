"use client";

import { Gift, Save } from "lucide-react";
import { Card, Input, Button } from "../../ui";

interface PromoEnvioCardProps {
  value: { desde: string; hasta: string };
  onChange: (v: { desde: string; hasta: string }) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export default function PromoEnvioCard({ value, onChange, dirty, saving, onSave }: PromoEnvioCardProps) {
  return (
    <Card
      header={
        <span className="flex items-center gap-2">
          <Gift size={18} className="text-brand" />
          Promo sellos: 6° envío gratis
        </span>
      }
    >
      <div className="space-y-4 max-w-sm">
        <p className="text-sm text-gray-600">
          Cada pedido con envío cobrado entre estas fechas suma un sello. Con 5, el próximo
          pedido con envío va sin costo de envío. Dejá las dos vacías para apagarla.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Desde"
            type="date"
            value={value.desde}
            onChange={(e) => onChange({ ...value, desde: e.target.value })}
          />
          <Input
            label="Hasta"
            type="date"
            value={value.hasta}
            onChange={(e) => onChange({ ...value, hasta: e.target.value })}
          />
        </div>
        <Button icon={Save} loading={saving} disabled={!dirty} onClick={onSave}>
          Guardar promo
        </Button>
      </div>
    </Card>
  );
}
