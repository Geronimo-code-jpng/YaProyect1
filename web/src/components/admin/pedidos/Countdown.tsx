"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Clock } from "lucide-react";

interface CountdownProps {
  expiraEn: string;
  className?: string;
}

function secondsLeft(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

/**
 * Self-contained pay-window countdown. Only this component re-renders each
 * second — the rest of the admin panel stays still.
 */
export default function Countdown({ expiraEn, className }: CountdownProps) {
  const [left, setLeft] = useState(() => secondsLeft(expiraEn));

  useEffect(() => {
    setLeft(secondsLeft(expiraEn));
    if (secondsLeft(expiraEn) <= 0) return;
    const id = setInterval(() => {
      const s = secondsLeft(expiraEn);
      setLeft(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiraEn]);

  const mm = Math.floor(left / 60);
  const ss = (left % 60).toString().padStart(2, "0");

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-bold tabular-nums",
        left > 0 ? "text-red-600" : "text-gray-400",
        className,
      )}
    >
      <Clock size={12} />
      {left > 0 ? `${mm}:${ss} para pagar` : "Tiempo vencido"}
    </span>
  );
}
