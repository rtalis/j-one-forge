import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Download, RefreshCw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UsuarioMenu } from "@/components/usuario-menu";
import { useTopo } from "@/lib/topo";
import { cn } from "@/lib/utils";

/** Botão quadrado da barra (Atualizar, Exportar...). Use em `acoes` para manter o padrão. */
export const botaoBarra =
  "inline-flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent/40 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50 cursor-pointer";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Faixa verde (cor do menu lateral) no topo da área da ferramenta, numa linha só:
 * título · subtítulo da tela à esquerda; "Atualizado em", Atualizar, Exportar e
 * o usuário à direita. O "Voltar ao Portal" fica na mesma altura, no topo do menu.
 *
 * Título, subtítulo e Exportar vêm do <PageHeader> da tela aberta.
 * Atualizar recarrega todas as consultas ativas do React Query da tela.
 * Ícones extras da ferramenta entram em `acoes`, antes do Atualizar.
 */
export function BarraSuperior({ acoes }: { acoes?: ReactNode }) {
  const queryClient = useQueryClient();
  const atualizando = useIsFetching() > 0;
  const { info, exportarRef } = useTopo();

  // Última carga com sucesso entre as consultas da tela (re-renderiza a cada busca).
  const ultima = Math.max(
    0,
    ...queryClient
      .getQueryCache()
      .getAll()
      .filter((q) => q.isActive())
      .map((q) => q.state.dataUpdatedAt),
  );
  const atualizadoEm = ultima > 0 ? dataHora.format(ultima).replace(", ", " às ") : null;

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 bg-sidebar px-6 text-sidebar-foreground">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* No celular o menu lateral fica escondido: este botão abre o menu. */}
        <SidebarTrigger className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent md:hidden" />
        {info && (
          <div className="flex min-w-0 items-baseline gap-2.5">
            <h1 className="shrink-0 truncate text-[17px] font-semibold tracking-tight">
              {info.titulo}
            </h1>
            {info.subtitulo && (
              <p className="hidden min-w-0 truncate text-xs text-sidebar-foreground/75 md:block">
                · {info.subtitulo}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {atualizadoEm && (
          <span
            className="mr-1 hidden text-xs text-sidebar-foreground/80 sm:inline"
            title="Quando os dados desta tela foram carregados"
          >
            Atualizado em {atualizadoEm}
          </span>
        )}
        {acoes}
        <button
          type="button"
          onClick={() => void queryClient.refetchQueries({ type: "active" })}
          disabled={atualizando}
          className={botaoBarra}
          title="Atualizar"
          aria-label="Atualizar"
        >
          <RefreshCw className={cn("h-4 w-4", atualizando && "animate-spin")} />
        </button>
        {info?.temExportar && (
          <button
            type="button"
            onClick={() => exportarRef.current?.()}
            disabled={info.exportarDesabilitado}
            className={botaoBarra}
            title="Exportar"
            aria-label="Exportar"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        <UsuarioMenu escuro />
      </div>
    </div>
  );
}
