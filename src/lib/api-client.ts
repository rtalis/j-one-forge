import { notifyUnauthorized } from "./auth";
import { APP_CONFIG } from "@/app.config";
import { avisarFailover } from "@/lib/aviso-failover";

function readEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v =
      (typeof import.meta !== "undefined" && import.meta.env?.[k]) ||
      (typeof process !== "undefined" && process.env?.[k]);
    if (v) return String(v);
  }
  return undefined;
}

// Endereços da API, em ordem de preferência (mesma lógica do Portal J-One).
// A ferramenta passa para o seguinte quando o atual está "fora do ar" e fica
// nele até recarregar a página:
// - sem resposta: falha de rede/DNS/TLS/CORS, ou nada em TEMPO_LIMITE_MS;
// - GET com qualquer 5xx. Só GET, que pode repetir sem efeito colateral;
//   POST/PUT/PATCH/DELETE com 5xx voltam como erro normal, porque o primeiro
//   servidor pode já ter gravado algo.
// Todos servem a MESMA API (mesmo banco e mesmo segredo JWT), então os tokens
// valem em qualquer um.
//
// Endereços vêm do .env:
//   VITE_API_URL         -> principal
//   VITE_API_BACKUP_URL  -> reserva (aceita vários, separados por vírgula)
// Com o .env preenchido, só esses endereços são usados. Sem nenhum dos dois,
// vale APP_CONFIG.apiUrls. Endereço repetido entra uma vez só.
const listaDoEnv = (chave: string) =>
  (readEnv(chave) ?? "")
    .split(",")
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const API_URLS: string[] = (() => {
  const doEnv = [...listaDoEnv("VITE_API_URL"), ...listaDoEnv("VITE_API_BACKUP_URL")];
  return [...new Set(doEnv.length > 0 ? doEnv : APP_CONFIG.apiUrls)];
})();

let indiceApi = 0;

/** Endereço da API em uso agora (muda se o principal cair). */
export function apiBaseAtual(): string {
  return API_URLS[indiceApi]!;
}

/** Endereço principal da API (o primeiro da lista). */
export const API_BASE = API_URLS[0]!;

export const APP_ID = Number(
  readEnv("VITE_APP_ID", "VITE_APPID", "APPID") || APP_CONFIG.defaultAppId,
);

/** Tempo máximo para cada endereço começar a responder. */
const TEMPO_LIMITE_MS = 10_000;
/** Qualquer 5xx: erro do servidor (ou do proxy na frente dele). */
const hostComFalha = (status: number) => status >= 500;

/** Sem resposta de nenhum endereço da API (rede/DNS/CORS ou tempo esgotado). */
export class ApiIndisponivelError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "ApiIndisponivelError";
  }
}

async function fetchComTempoLimite(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TEMPO_LIMITE_MS);
  // Respeita o signal de quem chamou (ex.: cancelamento do React Query).
  const externo = init.signal;
  const repassar = () => ctrl.abort();
  if (externo) {
    if (externo.aborted) ctrl.abort();
    else externo.addEventListener("abort", repassar, { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (externo?.aborted) throw err;
    if (ctrl.signal.aborted) {
      throw new ApiIndisponivelError(`Sem resposta em ${TEMPO_LIMITE_MS / 1000} s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
    externo?.removeEventListener("abort", repassar);
  }
}

/** Motivo curto da falha de um endereço, para o aviso de failover. */
function motivoDaFalha(err: unknown): string {
  if (err instanceof ApiIndisponivelError) return `sem resposta em ${TEMPO_LIMITE_MS / 1000} s`;
  return "sem resposta";
}

/** fetch na API, com troca para o próximo endereço se o atual estiver fora do ar.
 * Cada troca aparece no aviso de failover (canto inferior direito). */
async function fetchComFallback(caminho: string, init: RequestInit): Promise<Response> {
  const repetivel = (init.method ?? "GET").toUpperCase() === "GET";
  let ultimaResposta: Response | null = null;
  // Endereço que falhou por último e o motivo (para o aviso).
  let falhou: { url: string; motivo: string } | null = null;
  const encerrarAviso = () => {
    if (falhou)
      avisarFailover({ fase: "falhou", de: falhou.url, para: falhou.url, motivo: falhou.motivo });
  };
  for (let tentativa = 0; tentativa < API_URLS.length; tentativa++) {
    const i = (indiceApi + tentativa) % API_URLS.length;
    if (falhou)
      avisarFailover({
        fase: "tentando",
        de: falhou.url,
        para: API_URLS[i]!,
        motivo: falhou.motivo,
      });
    let resp: Response;
    try {
      resp = await fetchComTempoLimite(`${API_URLS[i]}${caminho}`, init);
    } catch (err) {
      // Cancelado por quem chamou: não é queda do servidor.
      if (init.signal?.aborted) {
        encerrarAviso();
        throw err;
      }
      // Sem resposta (rede, DNS, CORS, tempo esgotado). Erro HTTP não chega aqui.
      console.warn(`[api] ${API_URLS[i]} não respondeu:`, err);
      falhou = { url: API_URLS[i]!, motivo: motivoDaFalha(err) };
      continue;
    }
    if (repetivel && hostComFalha(resp.status) && tentativa < API_URLS.length - 1) {
      console.warn(`[api] ${API_URLS[i]} respondeu ${resp.status}; tentando o próximo endereço.`);
      ultimaResposta = resp;
      falhou = { url: API_URLS[i]!, motivo: `HTTP ${resp.status}` };
      continue;
    }
    if (i !== indiceApi && !hostComFalha(resp.status)) {
      console.warn(`[api] API principal indisponível; usando ${API_URLS[i]}`);
      indiceApi = i;
      if (falhou)
        avisarFailover({
          fase: "usando",
          de: falhou.url,
          para: API_URLS[i]!,
          motivo: falhou.motivo,
        });
    } else {
      encerrarAviso();
    }
    return resp;
  }
  // Todos fora: devolve o último 5xx (vira erro HTTP normal) ou o erro de rede.
  encerrarAviso();
  if (ultimaResposta) return ultimaResposta;
  // O detalhe de cada endereço já foi para o console acima.
  throw new ApiIndisponivelError(
    "Não foi possível conectar à API. Verifique sua conexão e tente novamente.",
  );
}

export class ApiError extends Error {
  status: number;
  /** Endereço chamado (vai no "Copiar" do toast de erro, para o suporte). */
  url: string | null;
  constructor(message: string, status: number, url: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  // URL absoluta: chamada direta, sem fallback.
  const response = path.startsWith("http")
    ? await fetchComTempoLimite(path, options)
    : await fetchComFallback(path, options);

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
  const erro = await erroDaResposta(response);
  erro.url = response.url || null;
  return erro;
}

async function erroDaResposta(response: Response): Promise<ApiError> {
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
      return new ApiError(
        "Usuário ou senha incorretos. Por favor, verifique suas credenciais.",
        401,
      );
    }
    return new ApiError(message, 401);
  }

  if (response.status === 403) {
    if (message.includes("Invalid CORS request") || text.includes("Invalid CORS request")) {
      return new ApiError(
        "Erro de CORS/Permissão (403): O backend rejeitou a requisição desta origem. Verifique as origens permitidas (allowedOrigins) no Spring Boot.",
        403,
      );
    }
    return new ApiError(
      message || "Acesso negado: você não possui permissão para acessar este recurso (403).",
      403,
    );
  }

  if (response.status === 404) {
    return new ApiError(message || `Recurso não encontrado no servidor (404).`, 404);
  }

  if (response.status >= 500) {
    return new ApiError(
      message || `Erro interno no servidor (${response.status}). Tente novamente mais tarde.`,
      response.status,
    );
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
