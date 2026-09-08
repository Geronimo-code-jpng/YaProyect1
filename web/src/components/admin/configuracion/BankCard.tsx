"use client";

import { Landmark, Save } from "lucide-react";
import { Card, Input, Button } from "../../ui";
import type { BankInfo } from "./useConfiguracion";

interface BankCardProps {
  value: BankInfo;
  onChange: (next: BankInfo) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export default function BankCard({
  value,
  onChange,
  dirty,
  saving,
  onSave,
}: BankCardProps) {
  const set = (key: keyof BankInfo, v: string) =>
    onChange({ ...value, [key]: v });

  const cbuDigits = value.cbu.replace(/\D/g, "").length;
  const cbuError =
    value.cbu.trim() && cbuDigits !== 22
      ? `El CBU debe tener 22 dígitos (tenés ${cbuDigits}).`
      : null;

  return (
    <Card
      header={
        <span className="flex items-center gap-2">
          <Landmark size={18} className="text-brand" />
          Datos de transferencia bancaria
        </span>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Input
          label="Banco"
          value={value.banco}
          onChange={(e) => set("banco", e.target.value)}
          placeholder="ej: Banco Nación"
        />
        <Input
          label="Titular de la cuenta"
          value={value.titular}
          onChange={(e) => set("titular", e.target.value)}
          placeholder="Nombre y apellido"
        />
        <Input
          label="Alias"
          value={value.alias}
          onChange={(e) => set("alias", e.target.value)}
          placeholder="ej: tienda.mp"
        />
        <Input
          label="CBU"
          value={value.cbu}
          onChange={(e) => set("cbu", e.target.value)}
          placeholder="0000000000000000000000"
          inputMode="numeric"
          error={cbuError}
        />
        <div className="sm:col-span-2 flex flex-col gap-2">
          <Button
            icon={Save}
            loading={saving}
            disabled={!dirty || Boolean(cbuError)}
            onClick={onSave}
          >
            Guardar datos bancarios
          </Button>
          <p className="text-xs text-gray-500">
            Se muestran a los clientes que eligen &ldquo;Transferencia
            bancaria&rdquo; como método de pago.
          </p>
        </div>
      </div>
    </Card>
  );
}
