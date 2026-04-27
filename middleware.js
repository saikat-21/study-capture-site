import { NextResponse } from "next/server";

const EXTENSION_API_PREFIXES = ["/api/auth/", "/api/license/"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Study-Capture-Client",
  "Access-Control-Max-Age": "86400"
};

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  if (!EXTENSION_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  const response = NextResponse.next();
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};
