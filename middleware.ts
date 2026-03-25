import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Site-wide HTTP Basic Auth when `ADMIN_BASIC_AUTH_USER` and
 * `ADMIN_BASIC_AUTH_PASSWORD` are set (recommended in production).
 * If either is unset, requests pass through (local dev without env).
 */
export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_BASIC_AUTH_USER?.trim();
  const pass = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && (!user || !pass)) {
    return new NextResponse(
      "Missing ADMIN_BASIC_AUTH_USER / ADMIN_BASIC_AUTH_PASSWORD on server",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  if (!user || !pass) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = atob(auth.slice(6));
  } catch {
    return unauthorized();
  }

  const colon = decoded.indexOf(":");
  if (colon < 0) {
    return unauthorized();
  }

  const u = decoded.slice(0, colon);
  const p = decoded.slice(colon + 1);

  if (u !== user || p !== pass) {
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  return NextResponse.next();
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except Next internals and common static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
