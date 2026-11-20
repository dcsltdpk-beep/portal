import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

// Redirect anyone without a valid session to /login
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never block static assets, images or favicon
  if (
    pathname === "/logo.png" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next") ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const session = await verifySession(req.cookies.get(COOKIE)?.value);
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
