import { createHash, randomBytes } from "node:crypto";

// Login/registro con OAuth 2.0 (Authorization Code + PKCE). El intercambio del
// `code` por el token se hace acá, en el servidor, con el client secret; el
// navegador nunca ve el access token de Google.
//
// Para sumar otro proveedor alcanza con agregarlo a PROVIDERS y crear sus
// credenciales: las rutas /api/auth/oauth/[provider]/** son genéricas.

export interface OAuthProfile {
  email: string;
  emailVerified: boolean;
  nombre: string;
}

interface OAuthProvider {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
  fetchProfile: (accessToken: string) => Promise<OAuthProfile>;
}

export const PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    async fetchProfile(accessToken) {
      const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`userinfo ${res.status}`);
      const data = await res.json();
      return {
        email: String(data.email || "").toLowerCase(),
        emailVerified: data.email_verified === true,
        nombre: data.name || data.given_name || String(data.email || "").split("@")[0],
      };
    },
  },
};

// Cookie con el state + code_verifier entre la ida a Google y la vuelta.
export const FLOW_COOKIE = "oauth_flow";
export const FLOW_COOKIE_PATH = "/api/auth/oauth";

export interface OAuthFlow {
  state: string;
  verifier: string;
  next: string;
  tipo: string;
}

// Mismas opciones que el <select> de "Tipo de cliente" del registro.
const TIPOS_CLIENTE = ["Personal", "Kiosco", "Almacén", "Empresa"];

export function sanitizeTipo(tipo: string | null): string {
  return tipo && TIPOS_CLIENTE.includes(tipo) ? tipo : "Personal";
}

// Solo rutas internas: evita usar el login como redirector abierto.
export function sanitizeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function callbackUrl(origin: string, provider: string): string {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}
