import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/book/confirm"];
const adminRoutes = ["/admin"];

function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isLoggedIn(request: NextRequest): boolean {
  // Auth.js v5 JWT 쿠키 이름 (개발: http, 배포: https)
  return Boolean(
    request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token"),
  );
}

export function proxy(request: NextRequest) {
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

  if (isRouteMatch(nextUrl.pathname, adminRoutes)) {
    if (!loggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set(
        "callbackUrl",
        `${nextUrl.pathname}${nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }
    // admin role 확인은 API route에서 처리
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/book/confirm/:path*", "/admin/:path*"],
};
