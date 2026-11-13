import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ListaExcel, type Opcao } from "./lista-excel";

import type { Selecao } from "./filtros";

/**
 * Filtro da barra de filtros, no padrão do Excel: rótulo em cima, botão com o
 * resumo da seleção ("Todos", o item, ou "3 selecionados") e a lista ao abrir.
 */
export function FiltroExcel({
  rotulo,
  todos = "Todos",
  opcoes,
  selecionados,
  onAplicar,
}: {
  rotulo: string;
  /** Texto quando nada está filtrado ("Todos", "Todas"). */
  todos?: string;
  opcoes: Opcao[];
  selecionados: Selecao;
  onAplicar: (v: Selecao) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const resumo = !selecionados.length
    ? todos
    : selecionados.length === 1
      ? (opcoes.find((o) => o.valor === selecionados[0])?.rotulo ?? todos)
      : `${selecionados.length} selecionados`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </span>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-44 max-w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-card px-3 text-left text-[13px] hover:border-primary",
              selecionados.length > 0 && "border-primary font-semibold ring-1 ring-primary",
            )}
          >
            <span className="truncate">{resumo}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                aberto && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 rounded-2xl p-3">
          {aberto && (
            <ListaExcel
              opcoes={opcoes}
              selecionados={selecionados}
              onAplicar={onAplicar}
              onFechar={() => setAberto(false)}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Botão de filtro no cabeçalho verde da coluna (mesma lista do Excel). */
export function FiltroColuna({
  opcoes,
  selecionados,
  onAplicar,
}: {
  /** Calculadas só ao abrir (colunas com muitos valores). */
  opcoes: () => Opcao[];
  selecionados: Selecao;
  onAplicar: (v: Selecao) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ativo = selecionados.length > 0;
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Filtrar coluna"
          title="Filtrar coluna"
          className={cn(
            "inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors hover:bg-primary-foreground/20",
            ativo && "bg-primary-foreground text-primary hover:bg-primary-foreground",
          )}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 rounded-2xl p-3 normal-case tracking-normal"
        onClick={(e) => e.stopPropagation()}
      >
        {aberto && (
          <ListaExcel
            opcoes={opcoes()}
            selecionados={selecionados}
            onAplicar={onAplicar}
            onFechar={() => setAberto(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
