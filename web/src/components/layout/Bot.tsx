"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from 'lucide-react';
import { useCart } from "../../contexts/CartContext";
import type { Product } from "../../types";
import clsx from "clsx";

interface ChatBlock {
  type: "text";
  content?: string;
}

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content?: string;
  blocks?: ChatBlock[];
  products?: Product[];
  status?: "streaming" | "done" | "error";
}

const API_URL = "/api/chat";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function BotAvatarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="11" width="18" height="9" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <path d="M8 16h.01" />
      <path d="M16 16h.01" />
    </svg>
  );
}

function ChatToggleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function parseProductLine(
  line: string,
): { name: string; price: string; extras: string } | null {
  const trimmed = line.replace(/^-\s*/, "").trim();
  if (!trimmed) return null;

  const priceMatch = trimmed.match(/a\s*\$?([\d.,]+)/i);
  if (!priceMatch) return null;

  const price = priceMatch[0];
  const name = trimmed.substring(0, trimmed.indexOf(priceMatch[0])).trim();
  const extras = trimmed
    .substring(trimmed.indexOf(priceMatch[0]) + price.length)
    .trim();

  return { name, price, extras };
}

function InlineProduct({
  line,
  products,
}: {
  line: string;
  onAddToCart: (name: string, price: string) => void;
  products?: Product[];
}) {
  const { addToCart } = useCart();
  const product = parseProductLine(line);

  if (!product) {
    return (
      <div className="py-0.5 text-sm leading-relaxed text-gray-800">{line}</div>
    );
  }

  const matchedProduct = products?.find((p) => {
    const normalizedName = p.nombre.toLowerCase().trim();
    const lineName = product.name.toLowerCase().trim();
    return (
      normalizedName.includes(lineName) || lineName.includes(normalizedName)
    );
  });

  return (
    <div className="group flex items-center py-2 w-full">
      <div className="flex flex-row w-full gap-3 border border-black/20 p-3 rounded-2xl text-sm leading-relaxed text-gray-800 shadow-sm">

        {matchedProduct?.Imagen && (
          <img
            src={matchedProduct.Imagen}
            alt={product.name}
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl shrink-0 border border-gray-100"
          />
        )}

        <div className="flex flex-col flex-1 min-w-0 justify-between">

          <div className="flex flex-col mb-2">
            <span className="font-semibold text-gray-900 truncate">
              {product.name}
            </span>
            <span className="font-medium text-gray-700">
              {product.price}
            </span>
            {product.extras && (
              <span className="mt-0.5 text-xs font-extrabold text-red-500 line-clamp-2">
                {product.extras}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (matchedProduct) {
                addToCart(matchedProduct);
              }
            }}
            className="w-full sm:w-fit sm:self-end mt-auto font-bold rounded-lg bg-[#f74d00] hover:bg-[#fc5e17] px-4 py-2 sm:px-3 sm:py-1.5 text-white cursor-pointer transition-colors text-sm sm:text-xs"
          >
            + Agregar
          </button>
        </div>

      </div>
    </div>
  );
}

function ChatBubble({
  chat,
  onAddToCart,
}: {
  chat: ChatMessage;
  onAddToCart: (name: string, price: string) => void;
}) {
  const isUser = chat.role === "user";
  const isError = chat.status === "error";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-amber-500 px-4 py-2 text-sm leading-relaxed text-white shadow-sm sm:max-w-[75%]">
          <p className="whitespace-pre-wrap">{chat.content}</p>
        </div>
      </div>
    );
  }

  const blocks = chat.blocks ?? [];
  const isTyping = chat.status === "streaming" && blocks.length === 0;

  return (
    <div className="flex flex-col items-start gap-1">
      {isTyping && (
        <div
          className={clsx(
            "max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-2 shadow-sm sm:max-w-[75%]",
            isError ? "border-red-200 bg-red-50" : "border-gray-200 bg-white",
          )}
        >
          <TypingDots />
        </div>
      )}

      {blocks.map((block, i) => {
        if (block.type === "text" && block.content) {
          const lines = block.content.split("\n");
          return (
            <div
              key={i}
              className={clsx(
                "max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-2 shadow-sm sm:max-w-[75%]",
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white",
              )}
            >
              {lines.map((line, j) => {
                if (line.startsWith("- ")) {
                  return (
                    <InlineProduct
                      key={`${i}-${j}`}
                      line={line}
                      products={chat.products}
                      onAddToCart={onAddToCart}
                    />
                  );
                }
                return (
                  <p
                    key={`${i}-${j}`}
                    className="whitespace-pre-wrap py-0.5 text-sm leading-relaxed text-gray-800"
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function Bot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function updateBotMessage(
    id: string,
    updater: (m: ChatMessage) => ChatMessage,
  ) {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
    };
    const botId = generateId();
    const botMsg: ChatMessage = {
      id: botId,
      role: "bot",
      blocks: [],
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setIsStreaming(true);

    const es = new EventSource(
      `${API_URL}?message=${encodeURIComponent(text)}`,
    );

    try {
      es.addEventListener("text", (e: MessageEvent) => {
        const chunk = JSON.parse(e.data);
        const content = chunk.content || "";

        updateBotMessage(botId, (m) => {
          const blocks = [...(m.blocks ?? [])];
          const last = blocks[blocks.length - 1];
          if (last?.type === "text") {
            blocks[blocks.length - 1] = {
              type: "text",
              content: (last.content ?? "") + content,
            };
          } else {
            blocks.push({ type: "text", content });
          }
          return { ...m, blocks };
        });
      });

      es.addEventListener("products", (e: MessageEvent) => {
        const chunk = JSON.parse(e.data);
        const products: Product[] = chunk.products || [];
        updateBotMessage(botId, (m) => ({ ...m, products }));
      });
    } catch (err) {
      console.error("Error:", err);
    }

    es.addEventListener("done", () => {
      updateBotMessage(botId, (m) => ({ ...m, status: "done" }));
      es.close();
      setIsStreaming(false);
    });

    es.onerror = () => {
      es.close();
      setIsStreaming(false);
      updateBotMessage(botId, (m) =>
        m.status === "streaming" ? { ...m, status: "error" } : m,
      );
    };
  }

  function handleAddToCart(name: string, price: string) {
    console.log("agregado al carrito:", { name, price });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed hover:cursor-pointer bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 sm:bottom-5 sm:right-5"
      >
        {isOpen ? <CloseIcon /> : <ChatToggleIcon />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 z-50 flex h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-gray-50 shadow-xl sm:bottom-5 sm:left-auto sm:right-5 sm:h-[75vh] sm:w-[420px] sm:rounded-2xl">
            <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
              <BotAvatarIcon />
              <span className="text-sm mr-auto font-semibold text-gray-800">
                YaMayorista
              </span>
              <button onClick={() => setIsOpen(!isOpen)} className="hover:bg-gray-200 hover:cursor-pointer rounded-sm"><X /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
                  <p>¿En qué te puedo ayudar?</p>
                </div>
              )}
              {messages.map((m) => (
                <ChatBubble key={m.id} chat={m} onAddToCart={handleAddToCart} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="escribí tu consulta..."
                className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                disabled={isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white disabled:opacity-40"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
