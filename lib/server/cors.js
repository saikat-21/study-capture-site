const SITE_ORIGINS = new Set([
  "https://studycapture.co",
  "https://www.studycapture.co"
]);

function isExtensionOrigin(origin) {
  return (
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("moz-extension://") ||
    origin.startsWith("safari-web-extension://")
  );
}

function allowedOriginForRequest(request) {
  const origin = request.headers.get("origin");
  if (!origin) return "*";
  if (SITE_ORIGINS.has(origin) || isExtensionOrigin(origin)) return origin;
  return null;
}

export function corsHeaders(request) {
  const allowedOrigin = allowedOriginForRequest(request);
  const headers = new Headers();

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }

  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, content-type, x-study-capture-client"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function corsPreflight(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}

export function withCors(request, response) {
  const headers = corsHeaders(request);
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}
