"use client";

import React from "react";
import clsx from "clsx";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string | null;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, id, className, ...props }, ref) {
    const fieldId =
      id || props.name || label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-bold text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          {...props}
          id={fieldId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={clsx(
            "w-full px-3.5 py-2.5 border rounded-xl font-medium text-sm text-gray-900 bg-white resize-y",
            "focus:outline-none focus:ring-2 focus:ring-brand/30",
            "disabled:bg-gray-50 disabled:text-gray-400",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:border-brand",
            className,
          )}
        />
        {error ? (
          <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
        ) : hint ? (
          <p className="text-xs text-gray-500 mt-1">{hint}</p>
        ) : null}
      </div>
    );
  },
);

export default Textarea;
