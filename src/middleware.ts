import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/register", "/api/auth"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) return NextResponse.next();

  // Auth.js v5 uses __Secure- prefix on HTTPS and "authjs.session-token" cookie name
  const useSecureCookies = req.nextUrl.protocol === "https:";
  const cookieName = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({ req, secret, cookieName });

  // If not authenticated, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;

  // Super-admin visiting /onboarding → redirect to /admin
  if (role === "SUPER_ADMIN" && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Non-super-admin visiting /admin → redirect to /onboarding
  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
