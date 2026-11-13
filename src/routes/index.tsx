import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRightLeft, Loader2, Server, Sparkles, Table2 } from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CardsSkeleton } from "@/components/loading-skeletons";
import { API_URLS, apiBaseAtual, apiGet } from "@/lib/api-client";
import { avisarFailover } from "@/lib/aviso-failover";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: `Início | ${APP_CONFIG.name}` }] }),
  component: HomePage,
});

/** Mostra o aviso de failover passando pelas fases, sem derrubar nenhum servidor. */
function simularFailover() {
  const de = API_URLS[0] ?? "https://principal.exemplo";
  const para = API_URLS[1] ?? "https://reserva.exemplo";
  avisarFailover({ fase: "tentando", de, para, motivo: "HTTP 503" });
  setTimeout(() => avisarFailover({ fase: "usando", de, para, motivo: "HTTP 503" }), 2500);
}

function HomePage() {
  const { token } = useAuth();
  const [shimmer, setShimmer] = useState(false);

  // Chamada REAL a uma rota que não existe: a API devolve erro e o toast padrão
  // (com "Copiar") aparece sozinho, com o título do meta. Nenhum try/catch na tela.
  const erroDemo = useMutation({
    mutationFn: () => apiGet("/api/v1/exemplo/rota-que-nao-existe", token ?? ""),
    meta: { erro: "Exemplo: falha ao consultar a API." },
  });

  const mostrarShimmer = () => {
    setShimmer(true);
    setTimeout(() => setShimmer(false), 2500);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <PageHeader title="Início" subtitle={APP_CONFIG.subtitle} />
      <main className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Base pronta: login, Portal J-One, tema, menu lateral e cliente de API. Os cards abaixo
          mostram os padrões do template em uso. Crie suas telas em{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">src/routes</code> e apague esta.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <Exemplo
            icone={Server}
            titulo="Endereços da API"
            texto="VITE_API_URL (principal) e VITE_API_BACKUP_URL (reserva) do .env; sem eles, APP_CONFIG.apiUrls."
          >
            <ol className="space-y-1.5 text-xs">
              {API_URLS.map((url, i) => (
                <li key={url} className="flex items-center gap-2">
                  <span className="w-4 text-muted-foreground">{i + 1}.</span>
                  <code className="truncate">{url}</code>
                  {url === apiBaseAtual() && <Badge className="ml-auto">em uso</Badge>}
                </li>
              ))}
            </ol>
          </Exemplo>

          <Exemplo
            icone={ArrowRightLeft}
            titulo="Aviso de servidor reserva"
            texto="Quando o endereço em uso cai, o app troca para o próximo e avisa no canto inferior direito."
          >
            <Button variant="outline" size="sm" onClick={simularFailover}>
              Simular troca de servidor
            </Button>
          </Exemplo>

          <Exemplo
            icone={AlertTriangle}
            titulo="Toast de erro"
            texto='Qualquer erro de useQuery/useMutation vira um toast com "Copiar" (relatório para o suporte). O título vem de meta.erro.'
          >
            <Button
              variant="outline"
              size="sm"
              disabled={erroDemo.isPending}
              onClick={() => erroDemo.mutate()}
            >
              {erroDemo.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Chamar rota inexistente
            </Button>
          </Exemplo>

          <Exemplo
            icone={Sparkles}
            titulo="Carregamento com shimmer"
            texto="Na primeira carga, use os modelos de loading-skeletons.tsx no lugar de spinner."
          >
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={mostrarShimmer} disabled={shimmer}>
                Ver shimmer
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/exemplo-tabela">
                  <Table2 className="h-3.5 w-3.5" /> Tabela de exemplo
                </Link>
              </Button>
            </div>
          </Exemplo>
        </div>

        {shimmer && <CardsSkeleton />}
      </main>
    </div>
  );
}

function Exemplo({
  icone: Icone,
  titulo,
  texto,
  children,
}: {
  icone: typeof Server;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icone className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          <p className="text-xs text-muted-foreground">{texto}</p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </Card>
  );
}
