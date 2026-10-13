import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, RefreshCw, Search } from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { downloadCsv, formatNumberBr } from "@/utils/export-csv";

export const Route = createFileRoute("/exemplo-tabela")({
  head: () => ({ meta: [{ title: `Exemplo de Tabela | ${APP_CONFIG.name}` }] }),
  component: ExemploTabelaPage,
});

// Mock data — replace with a useQuery(...) calling apiGet(path, token) from @/lib/api-client.
const DATA = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  descricao: `Item de exemplo ${i + 1}`,
  categoria: ["Alpha", "Beta", "Gamma"][i % 3]!,
  valor: (i + 1) * 1234.56,
}));

function ExemploTabelaPage() {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => DATA.filter((r) => r.descricao.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <PageHeader
        title="Exemplo de Tabela"
        subtitle="Estilo padrão de tabela, busca e exportação CSV"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs cursor-pointer"
              onClick={() =>
                downloadCsv(
                  ["ID", "Descrição", "Categoria", "Valor"],
                  rows.map((r) => [r.id, r.descricao, r.categoria, formatNumberBr(r.valor)]),
                  "exemplo",
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </>
        }
      />
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="h-8 bg-background pl-8 text-xs"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/70 bg-card">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                {["ID", "Descrição", "Categoria", "Valor (R$)"].map((h, i) => (
                  <th
                    key={h}
                    className={`sticky top-0 z-10 whitespace-nowrap border-b border-primary/20 bg-primary px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground ${
                      i === 3 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/50">
                  <td className="border-b px-3 py-2 font-mono text-muted-foreground">{r.id}</td>
                  <td className="border-b px-3 py-2">{r.descricao}</td>
                  <td className="border-b px-3 py-2">{r.categoria}</td>
                  <td className="border-b px-3 py-2 text-right tabular-nums">
                    {formatNumberBr(r.valor)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhum resultado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
