import { useEffect } from "react"

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

const COLORS: Record<string, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-9999 ${COLORS[type] || COLORS.info} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold`}
    >
      <i className={`fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-times-circle" : "fa-info-circle"} text-xl`}></i>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}
