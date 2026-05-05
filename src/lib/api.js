const API_URL = import.meta.env.VITE_API_URL;
const API_VERSION = "1";
let csrfToken = null;

if (!API_URL) {
  console.warn("VITE_API_URL is not set. API calls will fail.");
}

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function getCsrfToken() {
  return csrfToken;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Not authenticated") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends ApiError {
  constructor(message) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message, retryAfter) {
    super(429, message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Make an authenticated request. Returns parsed JSON on success.
 * Throws ApiError subclasses on non-2xx.
 *
 * @param {string} method
 * @param {string} path
 * @param {object} [options]
 * @param {object} [options.query]
 * @param {object} [options.body]
 * @param {boolean} [options.skipApiVersion]
 */ export async function apiRequest(method, path, options = {}) {
  const url = new URL(path, API_URL);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers = { Accept: "application/json" };

  if (!options.skipApiVersion) {
    headers["X-API-Version"] = API_VERSION;
  }

  const upperMethod = method.toUpperCase();
  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(upperMethod);

  if (isStateChanging) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers["X-CSRF-Token"] = csrf;
    }
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method: upperMethod,
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  return parseResponse(response);
}

export async function refreshSession() {
  try {
    const response = await fetch(new URL("/auth/refresh", API_URL).toString(), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });

    if (!response.ok) return false;

    const rawBody = await response.text();
    if (rawBody) {
      let parsed = null;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        parsed = null;
      }
      if (parsed && typeof parsed.csrf_token === "string") {
        setCsrfToken(parsed.csrf_token);
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function githubAuthUrl() {
  return `${API_URL}/auth/github?client_type=web`;
}

async function parseResponse(response) {
  const rawBody = await response.text();

  if (response.ok) {
    if (rawBody === "") return undefined;
    try {
      return JSON.parse(rawBody);
    } catch {
      throw new ApiError(
        response.status,
        "Invalid JSON in successful response",
      );
    }
  }

  let message = rawBody || `HTTP ${response.status}`;
  try {
    const parsed = JSON.parse(rawBody);
    if (parsed && typeof parsed.message === "string") {
      message = parsed.message;
    }
  } catch {
    // body wasn't JSON; used raw text
  }

  switch (response.status) {
    case 400:
      throw new ValidationError(message);
    case 401:
      throw new UnauthorizedError(message);
    case 403:
      throw new ForbiddenError(message);
    case 404:
      throw new NotFoundError(message);
    case 429: {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfter = retryAfterHeader
        ? Number.parseInt(retryAfterHeader, 10)
        : undefined;
      throw new RateLimitError(
        message,
        Number.isFinite(retryAfter) ? retryAfter : undefined,
      );
    }
    default:
      throw new ApiError(response.status, message);
  }
}
