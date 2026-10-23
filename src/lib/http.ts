// Helpers for the API route handlers: JSON responses and one place that turns errors into status codes

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });

const toResponse = (error: unknown) => {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('constraint')) return json({ error: `The data breaks a database rule: ${message}` }, 400);
  console.error(error);
  return json({ error: 'Something went wrong on the server.' }, 500);
};

// Reads a JSON request body, treating a missing or broken body as an empty object
export const readBody = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
};

type Handler<P> = (request: Request, params: P) => Response | Promise<Response>;

// Wraps a route handler so thrown errors become JSON error responses
export const handle = <P = Record<string, never>>(handler: Handler<P>) =>
  async (request: Request, context: { params: Promise<P> }) => {
    try {
      return await handler(request, await context.params);
    } catch (error) {
      return toResponse(error);
    }
  };
