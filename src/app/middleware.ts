import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/dashboard", "/my-bookings"];
const ADMIN_ROUTES = ["/admin"];
const DOCTOR_ROUTES = ["/doctor"];

function isMatched(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("diabstrok_token")?.value;
  const role = request.cookies.get("diabstrok_role")?.value;

  if ((pathname === "/signin" || pathname === "/signup") && token) {
    const destination = role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (!token && isMatched(pathname, AUTH_ROUTES)) {
    const callbackUrl = `${pathname}${search}`;
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
  }

  if (isMatched(pathname, ADMIN_ROUTES) && role !== "admin") {
    const destination = token ? (role === "doctor" ? "/doctor" : "/dashboard") : "/signin";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isMatched(pathname, DOCTOR_ROUTES) && role !== "doctor") {
    const destination = token ? (role === "admin" ? "/admin" : "/dashboard") : "/signin";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/signup", "/dashboard/:path*", "/my-bookings/:path*", "/admin/:path*", "/doctor/:path*"],
};
