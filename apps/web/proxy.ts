import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/verify-email") ||
    req.nextUrl.pathname.startsWith("/reset-password");
  const isRecoveryPage = req.nextUrl.pathname.startsWith("/recovery");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

  // Allow API auth routes to pass through
  if (isApiAuth) return NextResponse.next();

  // Allow recovery pages for authenticated users (post-registration flow)
  if (isRecoveryPage && isLoggedIn) return NextResponse.next();

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Redirect unauthenticated users to login (allow auth and recovery pages)
  if (!isLoggedIn && !isAuthPage && !isRecoveryPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
