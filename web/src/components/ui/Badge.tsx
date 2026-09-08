import React from "react";
import clsx from "clsx";

type Tone = "neutral" | "success" | "danger" | "warning" | "brand";
type Size = "sm" | "md";

interface BadgeProps {
  tone?: Tone;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const TONES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  brand: "bg-brand/10 text-brand",
};

const SIZES: Record<Size, string> = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export default function Badge({
  tone = "neutral",
  size = "sm",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap",
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
