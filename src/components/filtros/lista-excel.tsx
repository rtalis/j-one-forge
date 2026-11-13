import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type Opcao = { valor: string | number; rotulo: string };

/** Listas longas (produtos, clientes) mostram só os primeiros itens; a busca acha o resto. */
const LIMITE_LISTA = 200;

/**
 * Conteúdo do filtro no padrão do Excel: busca, (Selecionar todos), caixas e
 * Limpar filtro / Cancelar / OK. Monta a cada abertura (o estado começa do filtro atual).
 * `selecionados` vazio = todos.
 */
export function ListaExcel({
  opcoes,
  selecionados,
  onAplicar,
  onFechar,
}: {
  opcoes: Opcao[];
  selecionados: (string | number)[];
  onAplicar: (v: (string | number)[]) => void;
  onFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [marcados, setMarcados] = useState<Set<string | number>>(
    () => new Set(selecionados.length ? selecionados : opcoes.map((o) => o.valor)),
  );
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? opcoes.filter((o) => o.rotulo.toLowerCase().includes(q)) : opcoes;
  }, [busca, opcoes]);
  const nVis = visiveis.filter((o) => marcados.has(o.valor)).length;
  const todosMarcados = nVis === visiveis.length && nVis > 0;

  const alternarTodos = () => {
    const m = new Set(marcados);
    visiveis.forEach((o) => (todosMarcados ? m.delete(o.valor) : m.add(o.valor)));
    setMarcados(m);
  };
  const alternar = (v: string | number) => {
    const m = new Set(marcados);
    if (m.has(v)) m.delete(v);
    else m.add(v);
    setMarcados(m);
  };
  const ok = () => {
    // Como no Excel: com busca, o filtro fica só com os resultados marcados da busca.
    const base = busca.trim() ? visiveis : opcoes;
    const sel = base.filter((o) => marcados.has(o.valor)).map((o) => o.valor);
    onAplicar(sel.length === opcoes.length ? [] : sel);
    onFechar();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Input
        autoFocus
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && marcados.size > 0 && ok()}
        placeholder="Buscar..."
        className="h-10 rounded-xl"
      />
      <div className="max-h-64 overflow-auto rounded-xl border bg-card py-1">
        <label className="flex cursor-pointer items-center gap-2.5 border-b px-3 py-2 text-sm font-semibold normal-case tracking-normal text-foreground hover:bg-muted">
          <Checkbox
            checked={todosMarcados ? true : nVis > 0 ? "indeterminate" : false}
            onCheckedChange={alternarTodos}
          />
          (Selecionar todos)
        </label>
        {visiveis.slice(0, LIMITE_LISTA).map((o) => (
          <label
            key={String(o.valor)}
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground hover:bg-muted"
          >
            <Checkbox checked={marcados.has(o.valor)} onCheckedChange={() => alternar(o.valor)} />
            <span className="truncate">{o.rotulo}</span>
          </label>
        ))}
        {visiveis.length > LIMITE_LISTA && (
          <p className="px-3 py-2 text-xs font-normal normal-case tracking-normal text-muted-foreground">
            Mostrando {LIMITE_LISTA} de {visiveis.length.toLocaleString("pt-BR")}. Digite na busca
            para achar os outros.
          </p>
        )}
        {!visiveis.length && (
          <p className="px-3 py-2 text-xs font-normal normal-case text-muted-foreground">
            Nada encontrado.
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onAplicar([]);
            onFechar();
          }}
        >
          Limpar filtro
        </Button>
        <Button variant="secondary" size="sm" onClick={onFechar}>
          Cancelar
        </Button>
        <Button size="sm" onClick={ok} disabled={marcados.size === 0}>
          OK
        </Button>
      </div>
    </div>
  );
}
