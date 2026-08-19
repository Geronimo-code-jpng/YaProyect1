"use client";

import { MessageCircle } from "lucide-react";

// Botón provisional mientras el chatbot (Bot.tsx) queda comentado a la
// espera de una GEMINI_API_KEY nueva para este proyecto. Reemplazar por
// <Bot /> en AppShell.tsx una vez que la key esté configurada.
export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/3425084197"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-9000 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-4 py-3 rounded-full shadow-2xl transition font-bold"
      aria-label="Escribinos por WhatsApp"
    >
      <MessageCircle size={24} />
      <span className="hidden sm:inline">Escribinos</span>
    </a>
  );
}
