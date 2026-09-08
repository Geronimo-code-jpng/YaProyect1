"use client";

import React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string | null;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, children, ...props },
  ref,
) {
  const selectId =
    id || props.name || label?.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-bold text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={clsx(
            "w-full appearance-none py-2.5 pl-3.5 pr-10 border rounded-xl font-medium text-sm text-gray-900 bg-white",
            "focus:outline-none focus:ring-2 focus:ring-brand/30",
            "disabled:bg-gray-50 disabled:text-gray-400",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:border-brand",
            className,
          )}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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

export default Select;
