import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, TriangleAlert } from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { TableSkeletonRows } from "@/components/loading-skeletons";
import { FiltroColuna, FiltroExcel } from "@/components/filtros/filtro-excel";
import { opcoesDe, passa, type Selecao } from "@/components/filtros/filtros";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { downloadCsv, formatNumberBr } from "@/utils/export-csv";

export const Route = createFileRoute("/exemplo-tabela")({
  head: () => ({ meta: [{ title: `Exemplo de Tabela | ${APP_CONFIG.name}` }] }),
  component: ExemploTabelaPage,
});

type Item = {
  id: number;
  descricao: string;
  categoria: string;
  loja: string;
  mes: number;
  status: "Ativo" | "Inativo";
  valor: number;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const LOJAS = ["Centro", "Shopping Norte", "Shopping Sul", "Aeroporto"];

// Mock — troque por: const { token } = useAuth(); apiGet<Item[]>("/api/v1/...", token!)
async function fetchItens(falhar: boolean): Promise<Item[]> {
  await new Promise((r) => setTimeout(r, 1200)); // simula a latência da API
  // "Simular erro": o mesmo erro que o apiGet lança quando a API responde 500.
  if (falhar)
    throw new ApiError("Erro interno no servidor (500). Tente novamente mais tarde.", 500);
  return Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    descricao: `Item de exemplo ${i + 1}`,
    categoria: ["Alpha", "Beta", "Gamma"][i % 3]!,
    loja: LOJAS[(i * 7) % LOJAS.length]!,
    mes: (i % 12) + 1,
    status: i % 5 === 0 ? "Inativo" : "Ativo",
    valor: ((i * 37) % 50) * 1234.56 + 99.9,
  }));
}

// ---------------------------------------------------------------------------
// Colunas: título, como mostrar, valor para ordenar e (opcional) filtro no cabeçalho.
// ---------------------------------------------------------------------------
type Coluna = {
  titulo: string;
  celula: (r: Item) => React.ReactNode;
  valor: (r: Item) => string | number;
  /** Mostra o filtro do Excel no cabeçalho (bom para colunas de texto). */
  filtro?: boolean;
};

const COLUNAS: Coluna[] = [
  { titulo: "ID", celula: (r) => r.id, valor: (r) => r.id },
  { titulo: "Descrição", celula: (r) => r.descricao, valor: (r) => r.descricao, filtro: true },
  { titulo: "Categoria", celula: (r) => r.categoria, valor: (r) => r.categoria, filtro: true },
  { titulo: "Loja", celula: (r) => r.loja, valor: (r) => r.loja, filtro: true },
  { titulo: "Mês", celula: (r) => MESES[r.mes - 1], valor: (r) => r.mes },
  { titulo: "Status", celula: (r) => r.status, valor: (r) => r.status, filtro: true },
  {
    titulo: "Valor (R$)",
    celula: (r) => formatNumberBr(r.valor),
    valor: (r) => r.valor,
  },
];

/** Filtros da barra (acima da tabela). Vazio = todos. */
type Filtros = { mes: Selecao; loja: Selecao; categoria: Selecao; status: Selecao };
const FILTROS_VAZIOS: Filtros = { mes: [], loja: [], categoria: [], status: [] };

type Ordem = { i: number; d: 1 | -1 } | null;

function ExemploTabelaPage() {
  const [q, setQ] = useState("");
  const [falhar, setFalhar] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  // Filtros do cabeçalho: índice da coluna → valores aceitos.
  const [filtrosCol, setFiltrosCol] = useState<Record<number, Selecao>>({});
  const [ordem, setOrdem] = useState<Ordem>(null);

  // Se falhar, o toast de erro (com "Copiar") aparece sozinho com esta mensagem.
  const query = useQuery({
    queryKey: ["exemplo-itens", falhar],
    queryFn: () => fetchItens(falhar),
    ...(falhar && { retry: false }), // no exemplo, mostra o erro sem esperar as novas tentativas
    meta: { erro: "Falha ao carregar os itens." },
  });
  const dados = useMemo(() => query.data ?? [], [query.data]);

  // 1) Barra de filtros + busca.
  const daBarra = useMemo(() => {
    const busca = q.trim().toLowerCase();
    return dados.filter(
      (r) =>
        passa(filtros.mes, r.mes) &&
        passa(filtros.loja, r.loja) &&
        passa(filtros.categoria, r.categoria) &&
        passa(filtros.status, r.status) &&
        (!busca || r.descricao.toLowerCase().includes(busca)),
    );
  }, [dados, filtros, q]);

  // 2) Filtros do cabeçalho, sobre o resultado da barra.
  const filtradas = useMemo(() => {
    const ativos = Object.entries(filtrosCol).filter(([, v]) => v.length);
    if (!ativos.length) return daBarra;
    return daBarra.filter((r) =>
      ativos.every(([i, sel]) => passa(sel, COLUNAS[Number(i)]!.valor(r))),
    );
  }, [daBarra, filtrosCol]);

  // 3) Ordenação por clique no título (alterna ▼ / ▲).
  const rows = useMemo(() => {
    if (!ordem) return filtradas;
    const v = COLUNAS[ordem.i]!.valor;
    return filtradas.slice().sort((a, b) => {
      const x = v(a);
      const y = v(b);
      const c =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "pt-BR", { numeric: true });
      return c * ordem.d;
    });
  }, [filtradas, ordem]);

  const set = (k: keyof Filtros) => (v: Selecao) => setFiltros((f) => ({ ...f, [k]: v }));
  const algumFiltro =
    Object.values(filtros).some((v) => v.length) ||
    Object.values(filtrosCol).some((v) => v.length) ||
    q.trim() !== "";
  const limpar = () => {
    setFiltros(FILTROS_VAZIOS);
    setFiltrosCol({});
    setQ("");
  };
  const total = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      {/* Título, subtítulo e Exportar (⤓) vão para a faixa verde; o Atualizar (↻) de lá
          já recarrega esta consulta. Aqui ficam só as ações próprias da tela. */}
      <PageHeader
        title="Exemplo de Tabela"
        subtitle="Filtros no padrão do Excel, ordenação, busca e exportação CSV"
        exportDisabled={rows.length === 0}
        onExport={() =>
          // Só as linhas filtradas, na ordem da tela.
          downloadCsv(
            ["ID", "Descrição", "Categoria", "Loja", "Mês", "Status", "Valor"],
            rows.map((r) => [
              r.id,
              r.descricao,
              r.categoria,
              r.loja,
              MESES[r.mes - 1]!,
              r.status,
              formatNumberBr(r.valor),
            ]),
            "exemplo",
          )
        }
        actions={
          <Button
            variant={falhar ? "destructive" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs cursor-pointer"
            onClick={() => setFalhar((v) => !v)}
            title="Liga/desliga uma falha simulada da API (toast de erro + estado de erro)"
          >
            <TriangleAlert className="h-3.5 w-3.5" />
            {falhar ? "Voltar ao normal" : "Simular erro"}
          </Button>
        }
      />
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
        {/* Barra de filtros (padrão indicadores): opções vêm dos próprios dados. */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card px-4 py-3">
          <FiltroExcel
            rotulo="Mês"
            opcoes={MESES.map((m, i) => ({ valor: i + 1, rotulo: m }))}
            selecionados={filtros.mes}
            onAplicar={set("mes")}
          />
          <FiltroExcel
            rotulo="Loja"
            todos="Todas"
            opcoes={opcoesDe(dados, (r) => r.loja)}
            selecionados={filtros.loja}
            onAplicar={set("loja")}
          />
          <FiltroExcel
            rotulo="Categoria"
            todos="Todas"
            opcoes={opcoesDe(dados, (r) => r.categoria)}
            selecionados={filtros.categoria}
            onAplicar={set("categoria")}
          />
          <FiltroExcel
            rotulo="Status"
            opcoes={opcoesDe(dados, (r) => r.status)}
            selecionados={filtros.status}
            onAplicar={set("status")}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Busca
            </span>
            <div className="relative w-56 max-w-full">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Descrição..."
                className="h-9 rounded-lg bg-card pl-8 text-[13px]"
              />
            </div>
          </div>
          {algumFiltro && (
            <Button variant="outline" size="sm" className="h-9 cursor-pointer" onClick={limpar}>
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/70 bg-card">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                {COLUNAS.map((c, i) => (
                  <th
                    key={c.titulo}
                    onClick={() =>
                      setOrdem((o) => (o?.i === i ? { i, d: o.d === 1 ? -1 : 1 } : { i, d: -1 }))
                    }
                    aria-sort={ordem?.i === i ? (ordem.d > 0 ? "ascending" : "descending") : "none"}
                    className={cn(
                      "sticky top-0 z-10 cursor-pointer select-none whitespace-nowrap border-b border-primary/20 bg-primary px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90",
                      "text-center",
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span>
                        {c.titulo}
                        {ordem?.i === i && (
                          <span className="ml-1 opacity-70">{ordem.d > 0 ? "▲" : "▼"}</span>
                        )}
                      </span>
                      {c.filtro && (
                        <FiltroColuna
                          // Opções a partir do que a barra já deixou passar.
                          opcoes={() => opcoesDe(daBarra, c.valor)}
                          selecionados={filtrosCol[i] ?? []}
                          onAplicar={(v) => setFiltrosCol((f) => ({ ...f, [i]: v }))}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Primeira carga: linhas em shimmer. Recarregar mantém os dados na tela. */}
              {query.isLoading && <TableSkeletonRows columns={COLUNAS.length} rows={12} centered />}
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors even:bg-muted/40 hover:bg-muted">
                  {COLUNAS.map((c) => (
                    <td
                      key={c.titulo}
                      className={cn(
                        "whitespace-nowrap border-b px-3 py-2 text-center tabular-nums",
                        c.titulo === "ID" && "font-mono text-muted-foreground",
                      )}
                    >
                      {c.celula(r)}
                    </td>
                  ))}
                </tr>
              ))}
              {!query.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS.length} className="py-10 text-center text-muted-foreground">
                    {query.isError
                      ? "Não foi possível carregar os dados."
                      : "Nenhum resultado para estes filtros."}
                  </td>
                </tr>
              )}
              {rows.length > 0 && (
                <tr className="bg-primary font-bold text-primary-foreground">
                  <td colSpan={COLUNAS.length - 1} className="px-3 py-2 text-center">
                    Total · {rows.length.toLocaleString("pt-BR")} de{" "}
                    {dados.length.toLocaleString("pt-BR")} itens
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{formatNumberBr(total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
