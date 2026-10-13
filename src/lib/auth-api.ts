import { APP_ID, apiPost } from "./api-client";

export { APP_ID };

export const loginClient = async (data: { username: string; password: string }) => {
  const json = await apiPost<{ token?: string; message?: string }>("/api/v1/auth/login", data);
  if (!json.token) throw new Error("Resposta de login sem token");
  return { token: json.token };
};

export interface PortalAuthPayload {
  portalToken?: string;
  userId?: number;
  appId?: number;
  ticket?: string;
  ssoTicket?: string;
}

export interface ExchangeTokenResponse {
  internalToken: string;
  user: {
    id: number;
    name: string;
    role: string;
    permissions: string[];
  };
}

/** POST /api/v1/auth/sso — autentica o ticket de uso único emitido pelo Portal J-One. */
export async function authenticateSsoTicket(
  ticket: string,
  appId: number = APP_ID,
): Promise<ExchangeTokenResponse> {
  return apiPost<ExchangeTokenResponse>("/api/v1/auth/sso", { ticket, appId });
}

/** POST /api/v1/auth/exchange-token — troca o token do Portal pelo JWT interno da API. */
export async function exchangePortalToken(
  payload: PortalAuthPayload,
): Promise<ExchangeTokenResponse> {
  const body = { appId: payload.appId ?? APP_ID, ...payload };
  return apiPost<ExchangeTokenResponse>("/api/v1/auth/exchange-token", body);
}
