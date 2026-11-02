import { NextResponse, type NextRequest } from "next/server";
import {
  PROVIDERS,
  FLOW_COOKIE,
  FLOW_COOKIE_PATH,
  callbackUrl,
  pkceChallenge,
  randomToken,
  sanitizeNext,
  sanitizeTipo,
  type OAuthFlow,
} from "@/lib/oauth";

// Arranca el login con el proveedor: /api/auth/oauth/google?next=/cart&tipo=Kiosco
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: name } = await params;
  const provider = PROVIDERS[name];
  const clientId = provider?.clientId();
  if (!provider || !clientId || !provider.clientSecret()) {
    return NextResponse.redirect(new URL("/login?oauth_error=config", request.url));
  }

  const { searchParams, origin } = request.nextUrl;
  const flow: OAuthFlow = {
    state: randomToken(),
    verifier: randomToken(),
    next: sanitizeNext(searchParams.get("next")),
    tipo: sanitizeTipo(searchParams.get("tipo")),
  };

  const authorize = new URL(provider.authorizeUrl);
  authorize.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(origin, name),
    response_type: "code",
    scope: provider.scope,
    state: flow.state,
    code_challenge: pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorize);
  response.cookies.set(FLOW_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // lax (no strict): la vuelta desde Google es una navegación cross-site.
    sameSite: "lax",
    path: FLOW_COOKIE_PATH,
    maxAge: 10 * 60,
  });
  return response;
}
