/**
 * Tiny HTTP helper backed by Node 18+ global `fetch`.
 *
 * Replaces the call patterns the codebase used `axios` for: GET with query
 * params, POST with a JSON body, both with custom headers and a timeout.
 * Built for slice #34 (replace `axios`) — see docs/codebase-assessment.md
 * F-DB-8. Stays deliberately small; if a request needs request cancellation,
 * upload streams, or response streaming, write it inline rather than
 * extending this module.
 *
 * Mirrors the parts of axios's response shape the codebase reads:
 *   - `data` is the parsed JSON (or `undefined` if the body isn't JSON)
 *   - `status` is the HTTP status code
 *   - `statusText` is the HTTP status text
 *
 * On non-2xx responses the helper still resolves with the response shape
 * (matching axios's default behaviour when `validateStatus` accepts the
 * code) — call sites that already inspect `response.data.<x>` to detect
 * "not found" continue to work unchanged.
 */

export interface HttpResponse<TData = unknown> {
  data: TData;
  status: number;
  statusText: string;
}

export interface HttpRequestOptions {
  /** Query parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Extra headers (Content-Type for POST is set automatically). */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds. Defaults to 10s. */
  timeout?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function buildUrl(url: string, params?: HttpRequestOptions['params']): string {
  if (!params) {
    return url;
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  if (!query) {
    return url;
  }
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}

async function readBody<TData>(response: Response): Promise<TData> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as TData;
  }
  // Fall back to text for non-JSON; cast is a deliberate compromise to
  // match axios's loose `data: any` shape without forcing every caller
  // to declare a generic.
  return (await response.text()) as unknown as TData;
}

export async function httpGet<TData = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<TData>> {
  const controller = new AbortController();
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(url, options.params), {
      method: 'GET',
      headers: options.headers,
      signal: controller.signal,
    });

    const data = await readBody<TData>(response);
    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function httpPost<TData = unknown>(
  url: string,
  body: unknown,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<TData>> {
  const controller = new AbortController();
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const isString = typeof body === 'string';
  const isUrlSearchParams = body instanceof URLSearchParams;
  const isNullish = body === undefined || body === null;
  // Use `unknown` to escape DOM-typed BodyInit which isn't always exposed
  // depending on the TS lib config; runtime fetch accepts these shapes.
  let requestBody: unknown;
  if (isNullish) {
    requestBody = undefined;
  } else if (isFormData || isString || isUrlSearchParams) {
    requestBody = body;
  } else {
    requestBody = JSON.stringify(body);
  }

  const headers: Record<string, string> = {...(options.headers ?? {})};
  // Auto-set Content-Type for JSON unless the caller already set one or
  // we're sending FormData (browser/Node sets it including the boundary).
  if (
    !headers['Content-Type'] &&
    !headers['content-type'] &&
    !isFormData &&
    !isUrlSearchParams &&
    !isNullish
  ) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(buildUrl(url, options.params), {
      method: 'POST',
      headers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: requestBody as any,
      signal: controller.signal,
    });

    const data = await readBody<TData>(response);
    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  } finally {
    clearTimeout(timer);
  }
}
