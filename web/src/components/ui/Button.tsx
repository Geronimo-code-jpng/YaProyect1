"use client";

import React from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand hover:bg-brand-hover text-white shadow-sm disabled:hover:bg-brand",
  secondary:
    "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 disabled:hover:bg-gray-100",
  danger:
    "bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:hover:bg-red-500",
  ghost:
    "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:hover:bg-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
};

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 16 };

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const iconPx = ICON_SIZE[size];
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <Loader2 size={iconPx} className="animate-spin" />
      ) : (
        Icon && <Icon size={iconPx} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={iconPx} />}
    </button>
  );
}
