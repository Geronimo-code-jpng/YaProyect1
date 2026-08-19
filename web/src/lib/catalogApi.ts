import { ENV } from "../config/env";
import type { Product } from "../types";

const BASE = ENV.CATALOG_API_URL;

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: options?.body instanceof FormData
      ? options?.headers
      : { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`Error en ${path}`);
  return res.json();
}

// --- Catálogo (lectura pública) ---

export async function fetchProductos(): Promise<Product[]> {
  return api("/api/productos");
}

export async function fetchProductoById(id: number | string): Promise<Product | null> {
  return api(`/api/productos/${id}`);
}

export async function fetchCategorias(): Promise<{ id: string; categoria: string }[]> {
  return api("/api/categorias");
}

export interface Configuracion {
  id: number;
  precio_envio: number;
  banco: string;
  titular: string;
  alias: string;
  cbu: string;
}

export async function fetchConfiguracion(): Promise<Configuracion | null> {
  return api("/api/configuracion");
}

export async function updateConfiguracion(data: Partial<Configuracion>): Promise<Configuracion> {
  return api("/api/configuracion", { method: "PATCH", body: JSON.stringify(data) });
}

export async function fetchOfertasAleatorias(): Promise<Product[]> {
  return api("/api/ofertas-aleatorias");
}

// --- Auth ---

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    telefono: string;
    direccion: string | null;
    tipo_cliente: string;
  };
  error?: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResult> {
  return api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function sendRecoveryEmail(email: string): Promise<{ success: boolean; error?: string }> {
  return api("/api/auth/send-recovery-email", { method: "POST", body: JSON.stringify({ email }) });
}

export async function verifyResetToken(token: string, email: string): Promise<{ success: boolean; email?: string; error?: string }> {
  return api("/api/auth/verify-reset-token", { method: "POST", body: JSON.stringify({ token, email }) });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  return api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) });
}

export async function apiRegister(data: {
  email: string;
  password: string;
  nombre: string;
  telefono: string;
  direccion?: string;
  tipo_cliente?: string;
}): Promise<AuthResult> {
  return api("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
}

// --- Perfiles ---

export async function fetchPerfilByEmail(email: string): Promise<any | null> {
  return api(`/api/perfiles?email=${encodeURIComponent(email)}`);
}

export async function fetchPerfilById(id: string): Promise<any | null> {
  return api(`/api/perfiles/${id}`);
}

export async function fetchPerfilesAdmin(): Promise<any[]> {
  return api("/api/admin/perfiles");
}

export async function updatePerfil(id: string, data: Record<string, unknown>): Promise<any> {
  return api(`/api/perfiles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

// --- Pedidos ---

export async function createPedido(data: Record<string, unknown>): Promise<any> {
  return api("/api/pedidos", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchPedidosByUserId(userId: string): Promise<any[]> {
  return api(`/api/pedidos?user_id=${encodeURIComponent(userId)}`);
}

export async function fetchPedidosByContact(nombre?: string, telefono?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (nombre) params.set("nombre", nombre);
  if (telefono) params.set("telefono", telefono);
  return api(`/api/pedidos?${params.toString()}`);
}

export async function fetchPedidoById(id: number | string): Promise<any | null> {
  return api(`/api/pedidos/${id}`);
}

export async function updatePedido(id: number | string, data: Record<string, unknown>, ifEstado?: string): Promise<any> {
  const query = ifEstado ? `?if_estado=${encodeURIComponent(ifEstado)}` : "";
  return api(`/api/pedidos/${id}${query}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function fetchPedidosAdmin(): Promise<any[]> {
  return api("/api/admin/pedidos");
}

export async function cleanupExpiredPedidos(): Promise<{ success: boolean }> {
  return api("/api/pedidos/cleanup-expired", { method: "POST" });
}

// --- Admin: productos / categorías / imágenes ---

export async function createProductoAdmin(data: Record<string, unknown>): Promise<Product> {
  return api("/api/admin/productos", { method: "POST", body: JSON.stringify(data) });
}

export async function updateProductoAdmin(id: number | string, data: Record<string, unknown>): Promise<Product> {
  return api(`/api/admin/productos/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteProductoAdmin(id: number | string): Promise<{ success: boolean }> {
  return api(`/api/admin/productos/${id}`, { method: "DELETE" });
}

export async function uploadProductoImage(id: number | string, file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return api(`/api/admin/productos/${id}/image`, { method: "POST", body: formData });
}

export async function createCategoriaAdmin(categoria: string): Promise<{ success: boolean; categoria?: any; error?: string }> {
  return api("/api/admin/categorias", { method: "POST", body: JSON.stringify({ categoria }) });
}

export async function deleteCategoriaAdmin(id: string): Promise<{ success: boolean }> {
  return api(`/api/admin/categorias/${id}`, { method: "DELETE" });
}
