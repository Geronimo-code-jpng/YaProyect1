"use client";

import React, { useId } from "react";
import clsx from "clsx";

type Tone = "brand" | "green" | "yellow" | "blue";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  /** Render the label for screen readers only. */
  hideLabel?: boolean;
  tone?: Tone;
  disabled?: boolean;
}

const TONE_ON: Record<Tone, string> = {
  brand: "bg-brand",
  green: "bg-green-500",
  yellow: "bg-amber-500",
  blue: "bg-blue-500",
};

export default function Toggle({
  checked,
  onChange,
  label,
  hideLabel = false,
  tone = "brand",
  disabled = false,
}: ToggleProps) {
  const id = useId();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? id : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand",
          "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          checked ? TONE_ON[tone] : "bg-gray-300",
        )}
      >
        <span
          className={clsx(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
      {label && (
        <span
          id={id}
          className={clsx(
            "text-sm font-bold text-gray-700",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
