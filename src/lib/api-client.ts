import { notifyUnauthorized } from "./auth";
import { APP_CONFIG } from "@/app.config";

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_URL"]) ||
  (typeof process !== "undefined" && process.env?.["VITE_API_URL"]) ||
  APP_CONFIG.defaultApiUrl;

export const APP_ID = Number(
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.["VITE_APP_ID"] || import.meta.env?.["VITE_APPID"] || import.meta.env?.["APPID"])) ||
  (typeof process !== "undefined" &&
    (process.env?.["VITE_APP_ID"] || process.env?.["VITE_APPID"] || process.env?.["APPID"])) ||
  APP_CONFIG.defaultAppId
);


export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  
  const response = await fetch(url, options);
  
  const isAuthRoute =
    path.includes("/api/v1/auth/login") ||
    path.includes("/api/v1/auth/sso") ||
    path.includes("/api/v1/auth/exchange-token");

  if (response.status === 401 && !isAuthRoute) {
    notifyUnauthorized();
  }
  
  return response;
}

async function parseApiError(response: Response): Promise<ApiError> {
  let text = "";
  try {
    text = await response.text();
  } catch {
    text = "";
  }

  let message = "";
  try {
    const parsed = JSON.parse(text);
    if (parsed.mensagem) message = String(parsed.mensagem);
    else if (parsed.message) message = String(parsed.message);
    else if (parsed.error && typeof parsed.error === "string") message = String(parsed.error);
    else if (parsed.detail) message = String(parsed.detail);
  } catch {
    message = text.trim();
  }

  if (response.status === 401) {
    if (!message || /^(bad credentials|unauthorized|status 401)$/i.test(message.trim())) {
      return new ApiError("Usuário ou senha incorretos. Por favor, verifique suas credenciais.", 401);
    }
    return new ApiError(message, 401);
  }

  if (response.status === 403) {
    if (message.includes("Invalid CORS request") || text.includes("Invalid CORS request")) {
      return new ApiError(
        "Erro de CORS/Permissão (403): O backend rejeitou a requisição desta origem. Verifique as origens permitidas (allowedOrigins) no Spring Boot.",
        403
      );
    }
    return new ApiError(message || "Acesso negado: você não possui permissão para acessar este recurso (403).", 403);
  }

  if (response.status === 404) {
    return new ApiError(message || `Recurso não encontrado no servidor (404).`, 404);
  }

  if (response.status >= 500) {
    return new ApiError(message || `Erro interno no servidor (${response.status}). Tente novamente mais tarde.`, response.status);
  }

  return new ApiError(message || `Erro na requisição (${response.status})`, response.status);
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await apiFetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw await parseApiError(response);
  }
  
  return response.json();
}

export async function apiPost<T = void>(path: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await apiFetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw await parseApiError(response);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export async function apiPut<T = void>(path: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await apiFetch(path, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export async function apiDelete<T = void>(path: string, token: string): Promise<T> {
  const response = await apiFetch(path, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}
