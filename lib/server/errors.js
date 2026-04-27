export class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok(data = {}, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

export function fail(error) {
  if (error instanceof HttpError) {
    return Response.json(
      {
        ok: false,
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      },
      { status: error.status }
    );
  }

  console.error(error);
  return Response.json(
    {
      ok: false,
      code: "internal_error",
      message: "Something went wrong. Please try again."
    },
    { status: 500 }
  );
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
}
