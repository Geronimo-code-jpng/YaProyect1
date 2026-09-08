"use client";

import React from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon: Icon, id, className, ...props },
  ref,
) {
  const inputId = id || props.name || label?.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-bold text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
        <input
          {...props}
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={clsx(
            "w-full py-2.5 border rounded-xl font-medium text-sm text-gray-900 bg-white",
            "focus:outline-none focus:ring-2 focus:ring-brand/30",
            "disabled:bg-gray-50 disabled:text-gray-400",
            Icon ? "pl-9 pr-3" : "px-3.5",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:border-brand",
            className,
          )}
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
