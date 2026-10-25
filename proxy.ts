import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isInstitutional = role === "institutional" || (role as string) === "insurer";
  const isPolicyholder = role === "policyholder";

  // 1. Allow public NextAuth endpoints
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 2. Allow signout page for session cleanup
  if (pathname === "/signout") {
    return NextResponse.next();
  }

  // 3. Auth pages: /login, /register, and registration gateways
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/");

  if (isAuthPage) {
    if (isLoggedIn) {
      const targetUrl = isInstitutional ? "/insurer" : "/portal";
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
    return NextResponse.next();
  }

  // 4. Root path: redirect to respective portal if authenticated, or serve landing page if guest
  if (pathname === "/") {
    if (isLoggedIn) {
      const targetUrl = isInstitutional ? "/insurer" : "/portal";
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
    return NextResponse.next();
  }

  // 5. Insurer-only routes: /insurer and /insurer/*
  if (pathname.startsWith("/insurer")) {
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    if (!isInstitutional) {
      // Role mismatch: only redirect if specifically policyholder; otherwise redirect to /login
      if (isPolicyholder) {
        return NextResponse.redirect(new URL("/portal", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  // 6. Policyholder-only routes: /portal and /portal/*
  if (pathname.startsWith("/portal")) {
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    if (!isPolicyholder) {
      // Role mismatch: only redirect if specifically institutional; otherwise redirect to /login
      if (isInstitutional) {
        return NextResponse.redirect(new URL("/insurer", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  // 7. Protected API endpoints
  if (pathname.startsWith("/api/insurer")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isInstitutional) {
      return NextResponse.json({ error: "Forbidden: Institutional role required" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/policyholder")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isPolicyholder) {
      return NextResponse.json({ error: "Forbidden: Policyholder role required" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Other internal business APIs: claims, policies, institutions
  if (
    pathname.startsWith("/api/claims") ||
    pathname.startsWith("/api/policies") ||
    pathname.startsWith("/api/institutions")
  ) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
