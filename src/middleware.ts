import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/register", "/api/auth"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) return;

  // If not authenticated, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  const role = (req.auth.user as { role?: string })?.role;

  // Super-admin visiting /onboarding → redirect to /admin
  if (role === "SUPER_ADMIN" && pathname.startsWith("/onboarding")) {
    return Response.redirect(new URL("/admin", req.url));
  }

  // Non-super-admin visiting /admin → redirect to /onboarding
  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return Response.redirect(new URL("/onboarding", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
