"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X } from "lucide-react";

type Size = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: Size;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Hide the header close button (e.g. tiny confirm dialogs). */
  hideClose?: boolean;
}

const SIZES: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export default function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
  hideClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Focus the first focusable element inside the panel.
    const focusTarget = panelRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    focusTarget?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 motion-safe:animate-[fadeIn_120ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={clsx(
          "w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden",
          "motion-safe:animate-[popIn_140ms_ease-out]",
          SIZES[size],
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <h2 id={titleId} className="text-xl font-black text-gray-900">
              {title}
            </h2>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 -mr-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
