"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  onCommit: () => void;
}

export default function QuantityStepper({
  value,
  onChange,
  onCommit,
}: QuantityStepperProps) {
  const step = (delta: number) => onChange(Math.max(1, (value || 1) + delta));

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
      <button
        type="button"
        aria-label="Restar una unidad"
        onClick={() => step(-1)}
        className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
        disabled={(value || 1) <= 1}
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min="1"
        value={value || 1}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        onBlur={onCommit}
        className="w-8 text-center text-sm font-bold tabular-nums border-x border-gray-300 py-1 focus:outline-none focus:bg-brand/5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Sumar una unidad"
        onClick={() => step(1)}
        className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
