"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

const CONFIG = {
  success: { bg: "bg-green-500", Icon: CheckCircle2 },
  error: { bg: "bg-red-500", Icon: XCircle },
  info: { bg: "bg-blue-500", Icon: Info },
} as const;

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const { bg, Icon } = CONFIG[type] || CONFIG.info;

  return (
    <div
      role="status"
      className={clsx(
        "fixed top-5 right-5 z-9999 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold max-w-sm",
        "motion-safe:animate-[popIn_140ms_ease-out]",
        bg,
      )}
    >
      <Icon size={20} className="shrink-0" />
      <span className="text-sm">{message}</span>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="ml-1 shrink-0 hover:opacity-70 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}
