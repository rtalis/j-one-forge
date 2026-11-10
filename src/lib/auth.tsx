import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { exchangePortalToken, authenticateSsoTicket, APP_ID } from "./auth-api";
import { APP_CONFIG } from "@/app.config";

const STORAGE_KEY = APP_CONFIG.storageKey;
const PORTAL_SESSION_KEY = `${APP_CONFIG.storageKey}_from_portal`;
export const UNAUTHORIZED_EVENT = "ruah:unauthorized";

// Captura o ticket SSO e o remove da URL já no carregamento do módulo, ANTES de o
// TanStack Router ler a localização. Se a limpeza ficar para um useEffect, o router já
// guardou `?sso=` no estado dele e o devolve à barra de endereço na próxima navegação.
let pendingSsoTicket: string | null = null;
if (typeof window !== "undefined") {
  try {
    const url = new URL(window.location.href);
    pendingSsoTicket = url.searchParams.get("sso");
    if (pendingSsoTicket) {
      url.searchParams.delete("sso");
      // Preserva o history.state para não quebrar o controle de histórico do router.
      window.history.replaceState(window.history.state, "", url.toString());
    }
  } catch {
    /* ignore */
  }
}

// Buffer portal auth event if postMessage arrives before React mounts
let bufferedPortalAuthEvent: { portalToken: string; userId: number; appId?: number } | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.data?.type === "jone-auth") {
      const { token, usuario, appId } = event.data || {};
      if (token && usuario?.id) {
        bufferedPortalAuthEvent = {
          portalToken: token,
          userId: Number(usuario.id),
          appId: appId ? Number(appId) : APP_ID,
        };
      }
    }
  });
}

export function isPortalEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (window.self !== window.top) return true;
  if (sessionStorage.getItem(PORTAL_SESSION_KEY) === "true") return true;
  if (pendingSsoTicket) return true;
  const params = new URLSearchParams(window.location.search);
  return (
    params.has("fromPortal") ||
    params.has("portal") ||
    params.has("sso") ||
    params.has("joneToken") ||
    params.has("jone_token")
  );
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error == null) return false;

  if (typeof error === "object") {
    const candidate = error as { status?: unknown; statusCode?: unknown; message?: unknown; cause?: unknown };
    if (candidate.status === 401 || candidate.statusCode === 401) return true;
    if (candidate.cause && candidate.cause !== error && isUnauthorizedError(candidate.cause)) return true;
    if (typeof candidate.message === "string") return isUnauthorizedError(candidate.message);
  }

  const message = String(error).toLowerCase();
  return message.includes("unauthorized") || message.includes("status 401") || message.includes("statuscode: 401");
}

export function notifyUnauthorized(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(STORAGE_KEY)) return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

type AuthValue = {
  token: string | null;
  username: string | null;
  ready: boolean;
  isFromPortal: boolean;
  isAuthenticatingPortal: boolean;
  signIn: (token: string, username: string) => void;
  signOut: () => void;
  voltarAoPortal: () => void;
};

// Keep a single context instance across HMR module duplicates, otherwise a
// reloaded copy of this module creates a new context and useAuth sees null.
const globalScope = globalThis as unknown as { __ruahAuthContext?: React.Context<AuthValue | null> };
const AuthContext =
  globalScope.__ruahAuthContext ?? (globalScope.__ruahAuthContext = createContext<AuthValue | null>(null));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isFromPortal, setIsFromPortal] = useState<boolean>(() => isPortalEnvironment());
  const [isAuthenticatingPortal, setIsAuthenticatingPortal] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const hasStored = Boolean(localStorage.getItem(STORAGE_KEY));
    if (hasStored) return false;
    return isPortalEnvironment();
  });

  useEffect(() => {
    // 1. Notifica o portal pai imediatamente se estiver em iframe para solicitar credenciais
    if (typeof window !== "undefined" && window.self !== window.top) {
      try {
        window.parent.postMessage({ type: "jone-ready" }, "*");
        window.parent.postMessage({ type: "request-auth" }, "*");
      } catch {}
    }

    // 2. Autentica via ticket SSO (já removido da URL no carregamento do módulo).
    // O ticket é de uso único: consome e descarta.
    const ssoTicket = pendingSsoTicket;
    pendingSsoTicket = null;

    if (ssoTicket) {
      setIsFromPortal(true);
      sessionStorage.setItem(PORTAL_SESSION_KEY, "true");
      setIsAuthenticatingPortal(true);
      authenticateSsoTicket(ssoTicket, APP_ID)
        .then((sessionData) => {
          signIn(sessionData.internalToken, sessionData.user?.name || "Usuário Portal");
          toast.success(`Acesso autorizado! Bem-vindo(a), ${sessionData.user?.name || "Usuário"}`);
        })
        .catch((err) => {
          console.error("Falha ao autenticar via ticket SSO:", err);
          setIsAuthenticatingPortal(false);
        });
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { token: string; username: string };
        setToken(parsed.token);
        setUsername(parsed.username);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Fallback timeout para não travar na tela de carregamento se o portal não enviar credenciais
  useEffect(() => {
    if (!isAuthenticatingPortal) return;
    const timer = setTimeout(() => {
      setIsAuthenticatingPortal(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isAuthenticatingPortal]);

  const signIn = useCallback((t: string, u: string) => {
    delete document.documentElement.dataset['authRedirecting'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, username: u }));
    setToken(t);
    setUsername(u);
    setIsAuthenticatingPortal(false);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUsername(null);
    setIsAuthenticatingPortal(false);
  }, []);

  const voltarAoPortal = useCallback(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.parent.postMessage({ type: "voltar-portal" }, "*");
    } else if (typeof window !== "undefined") {
      window.location.href = APP_CONFIG.portalUrl;
    }
  }, []);

  // Interceptador do Portal (Iframe PostMessage / Token Exchange)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const processPortalToken = async (portalToken: string, userId: number, appId: number = APP_ID) => {
      try {
        setIsFromPortal(true);
        sessionStorage.setItem(PORTAL_SESSION_KEY, "true");
        const sessionData = await exchangePortalToken({
          portalToken,
          userId,
          appId,
        });

        signIn(sessionData.internalToken, sessionData.user?.name || "Usuário Portal");
        toast.success(`Acesso autorizado! Bem-vindo(a), ${sessionData.user?.name || "Usuário"}`);
      } catch (error: unknown) {
        console.error("Falha na integração com o Portal:", error);
        const message = error instanceof Error ? error.message : "Acesso negado pela central.";
        toast.error(message);
        signOut();
      } finally {
        setIsAuthenticatingPortal(false);
      }
    };

    if (bufferedPortalAuthEvent) {
      const { portalToken, userId, appId } = bufferedPortalAuthEvent;
      bufferedPortalAuthEvent = null;
      void processPortalToken(portalToken, userId, appId ?? APP_ID);
    }

    const handlePortalMessage = async (event: MessageEvent) => {
      if (event.data?.type === "jone-auth") {
        const { token: portalToken, usuario, appId } = event.data || {};
        if (!portalToken || !usuario?.id) return;
        await processPortalToken(portalToken, Number(usuario.id), appId ? Number(appId) : APP_ID);
      }
    };

    window.addEventListener("message", handlePortalMessage);
    return () => {
      window.removeEventListener("message", handlePortalMessage);
    };
  }, [signIn, signOut]);

  useEffect(() => {
    const redirectToLogin = () => {
      if (!localStorage.getItem(STORAGE_KEY)) return;
      if (document.documentElement.dataset['authRedirecting'] === "true") return;
      document.documentElement.dataset['authRedirecting'] = "true";
      signOut();
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      setTimeout(() => {
        delete document.documentElement.dataset['authRedirecting'];
      }, 1500);
    };

    const handleGlobalError = (event: PromiseRejectionEvent | ErrorEvent) => {
      const error = "reason" in event ? event.reason : event.error;
      if (isUnauthorizedError(error)) redirectToLogin();
    };
    
    const handleGenericError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "reason" in event ? event.reason : event.error;
      const message = error?.message || String(error);
      
      // Ignore errors that we know are 401s or common noise
      if (
        (error?.name === "ApiIndisponivelError" ||
          message.includes("Falha") || message.includes("Failed to fetch") || message.includes("NetworkError")) &&
        !message.includes("401") &&
        !message.includes("Unauthorized") &&
        !message.includes("$TSR/Error")
      ) {
        toast.error(message || "Erro de comunicação com o servidor.");
      }
    };

    window.addEventListener("unhandledrejection", handleGlobalError);
    window.addEventListener("error", handleGlobalError);
    window.addEventListener(UNAUTHORIZED_EVENT, redirectToLogin);
    window.addEventListener("unhandledrejection", handleGenericError);
    window.addEventListener("error", handleGenericError);
    return () => {
      window.removeEventListener("unhandledrejection", handleGlobalError);
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(UNAUTHORIZED_EVENT, redirectToLogin);
      window.removeEventListener("unhandledrejection", handleGenericError);
      window.removeEventListener("error", handleGenericError);
    };
  }, [signOut]);

  const value = useMemo(
    () => ({ token, username, ready, isFromPortal, isAuthenticatingPortal, signIn, signOut, voltarAoPortal }),
    [token, username, ready, isFromPortal, isAuthenticatingPortal, signIn, signOut, voltarAoPortal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}