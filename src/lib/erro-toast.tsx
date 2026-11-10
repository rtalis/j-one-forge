// Toast de erro com um botão "Copiar": copia um relatório curto (o que houve,
// status HTTP, endereço chamado, página, versão, navegador e pilha) para o
// usuário colar no chamado do suporte. Nunca inclui tokens nem senhas.
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, X } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { APP_CONFIG } from "@/app.config";
import { APP_VERSION } from "@/data/versions";

function detalheCurto(err: unknown, titulo: string): string | undefined {
  if (err instanceof ApiError) {
    const msg = err.message && err.message !== titulo ? ` · ${err.message}` : "";
    return `HTTP ${err.status}${msg}`;
  }
  if (err instanceof TypeError) return "Sem resposta do servidor (rede ou API fora do ar).";
  if (err instanceof Error) return err.message || undefined;
  if (typeof err === "string") return err;
  return undefined;
}

function relatorio(titulo: string, err: unknown): string {
  const linhas = [
    `${APP_CONFIG.name} ${APP_VERSION} — erro`,
    `Quando: ${new Date().toISOString()}`,
    `Página: ${typeof location !== "undefined" ? location.href : "-"}`,
    `O que: ${titulo}`,
  ];
  if (err instanceof ApiError) {
    linhas.push(`HTTP: ${err.status}${err.url ? ` em ${err.url}` : ""}`);
  }
  if (err instanceof Error) {
    linhas.push(`Erro: ${err.name}: ${err.message}`);
  } else if (err !== undefined) {
    try {
      linhas.push(`Erro: ${typeof err === "string" ? err : JSON.stringify(err)}`);
    } catch {
      linhas.push(`Erro: ${String(err)}`);
    }
  }
  if (typeof navigator !== "undefined") linhas.push(`Navegador: ${navigator.userAgent}`);
  if (err instanceof Error && err.stack) linhas.push("", "Pilha:", err.stack);
  return linhas.join("\n");
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Clipboard API bloqueada (permissão/iframe): cai no método antigo.
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<"livre" | "copiado" | "falhou">("livre");
  return (
    <button
      type="button"
      onClick={async () => {
        setEstado((await copiar(texto)) ? "copiado" : "falhou");
        setTimeout(() => setEstado("livre"), 2000);
      }}
      title={
        estado === "copiado"
          ? "Copiado"
          : estado === "falhou"
            ? "Não foi possível copiar"
            : "Copiar os detalhes do erro para enviar ao suporte"
      }
      aria-label="Copiar os detalhes do erro"
      className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {estado === "copiado" ? (
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : estado === "falhou" ? (
        <X className="h-3.5 w-3.5 text-destructive" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/** Mostra um toast de erro com o botão "Copiar" e registra o erro no console.
 *
 * Erros de useQuery/useMutation já chamam isto sozinhos (ver src/router.tsx);
 * use direto só em chamadas fora do React Query:
 *
 *   try { await apiPost(...) } catch (err) { toastErro("Erro ao salvar.", err) }
 */
export function toastErro(titulo: string, err?: unknown) {
  if (err !== undefined) console.error(`[${APP_CONFIG.name}] ${titulo}`, err);
  const texto = relatorio(titulo, err);
  const descricao = detalheCurto(err, titulo);
  toast.error(titulo, {
    // Mesmo erro repetido (ex.: várias consultas falhando juntas) vira um toast só.
    id: `erro:${titulo}:${descricao ?? ""}`,
    description: descricao && descricao !== titulo ? descricao : undefined,
    action: <BotaoCopiar texto={texto} />,
    duration: 10_000,
  });
}
