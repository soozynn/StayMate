import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/book/confirm"];
const adminRoutes = ["/admin"];

function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isLoggedIn(request: NextRequest): boolean {
  // Auth.js v5: authjs.* / 일부 beta: next-auth.*
  return Boolean(
    request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token") ||
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token"),
  );
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const loggedIn = isLoggedIn(request);

  if (isRouteMatch(nextUrl.pathname, protectedRoutes) && !loggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isRouteMatch(nextUrl.pathname, adminRoutes) && !loggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/book/confirm/:path*", "/admin/:path*"],
};
