import { timingSafeEqual } from "node:crypto";
import { asc, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import {
  PROVIDERS,
  FLOW_COOKIE,
  FLOW_COOKIE_PATH,
  callbackUrl,
  type OAuthFlow,
} from "@/lib/oauth";

// Vuelta desde el proveedor: valida el state, cambia el code por un token,
// busca (o crea) el perfil por email y le pasa la sesión al navegador.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: name } = await params;
  const provider = PROVIDERS[name];
  const { searchParams, origin } = request.nextUrl;

  const fail = (code: string) => {
    const response = NextResponse.redirect(new URL(`/login?oauth_error=${code}`, origin));
    response.cookies.set(FLOW_COOKIE, "", { path: FLOW_COOKIE_PATH, maxAge: 0 });
    return response;
  };

  if (!provider) return fail("config");
  // El usuario canceló en la pantalla de Google.
  if (searchParams.get("error")) return fail("cancelado");

  let flow: OAuthFlow;
  try {
    flow = JSON.parse(request.cookies.get(FLOW_COOKIE)?.value ?? "");
  } catch {
    return fail("estado");
  }
  const state = searchParams.get("state") ?? "";
  const code = searchParams.get("code");
  if (!code || typeof flow?.state !== "string" || !safeEqual(state, flow.state)) {
    return fail("estado");
  }

  let profile;
  try {
    const tokenRes = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl(origin, name),
        client_id: provider.clientId() ?? "",
        client_secret: provider.clientSecret() ?? "",
        code_verifier: flow.verifier,
      }),
    });
    if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}: ${await tokenRes.text()}`);
    const { access_token } = await tokenRes.json();
    profile = await provider.fetchProfile(access_token);
  } catch (err) {
    console.error(`OAuth ${name}:`, err);
    return fail("proveedor");
  }

  // Sin email verificado no se puede asociar a un perfil sin riesgo de que
  // alguien entre a la cuenta de otro.
  if (!profile.email || !profile.emailVerified) return fail("email");

  // Si ya tiene cuenta con ese email (con contraseña o no), entra a esa misma.
  let [user] = await db
    .select()
    .from(perfiles)
    .where(sql`lower(${perfiles.email}) = ${profile.email}`)
    .orderBy(asc(perfiles.created_at))
    .limit(1);

  if (!user) {
    // Registro: el teléfono se pide al hacer el primer pedido.
    [user] = await db
      .insert(perfiles)
      .values({
        email: profile.email,
        password: null,
        nombre: profile.nombre,
        telefono: null,
        tipo_cliente: flow.tipo,
        direccion: null,
        rol: "user",
      })
      .returning();
  }

  // La sesión vive en localStorage (ver src/utils/authDB.ts): va en el #hash
  // para que no quede en logs del servidor ni se mande en el Referer.
  const payload = Buffer.from(
    JSON.stringify({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      next: flow.next,
    }),
  ).toString("base64url");

  const response = NextResponse.redirect(new URL(`/auth/oauth#${payload}`, origin));
  response.cookies.set(FLOW_COOKIE, "", { path: FLOW_COOKIE_PATH, maxAge: 0 });
  return response;
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
