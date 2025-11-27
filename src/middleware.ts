import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/setup-password",
    "/setup-admin",
    "/test",
    "/api/auth",
    "/api/test-db",
    "/api/create-test-student",
    "/api/mercadopago/webhook",
    "/api/cron",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Routes that require authentication but don't need role check
  const protectedWithoutRoleCheck = [
    "/change-password",
    "/api/change-password",
    "/api/check-temp-password",
  ];

  const isProtectedWithoutRoleCheck = protectedWithoutRoleCheck.some((route) =>
    pathname.startsWith(route),
  );

  // Allow public routes
  if (isPublicRoute) {
    // If already logged in, redirect to dashboard
    if (token && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = token.role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Allow protected routes without role check (like change-password)
  if (isProtectedWithoutRoleCheck) {
    return NextResponse.next();
  }

  // Role-based access control
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Students shouldn't access admin routes
  if (pathname.startsWith("/dashboard") && token.role === "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/((?!api/cron|api/auth|api/mercadopago/webhook|_next/static|_next/image|favicon.ico).*)",
  ],
};
