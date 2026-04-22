import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/workshop-api/")) {
    const headers = new Headers(request.headers);
    headers.set("X-Workshop-Secret", process.env.WORKSHOP_SECRET || "dev-secret");
    return NextResponse.rewrite(request.nextUrl, { request: { headers } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/workshop-api/:path*",
};
