import { createFileRoute } from "@tanstack/react-router";
import { APP_CONFIG } from "@/app.config";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth";
import { API_URLS, APP_ID, apiBaseAtual } from "@/lib/api-client";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: `Configurações | ${APP_CONFIG.name}` }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { username, isFromPortal } = useAuth();
  const rows: [string, string][] = [
    ["Usuário", username ?? "—"],
    ["Origem do acesso", isFromPortal ? "Portal J-One" : "Login direto"],
    ["API em uso", apiBaseAtual()],
    ["Endereços da API", API_URLS.join(", ")],
    ["App ID", String(APP_ID)],
  ];
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <PageHeader title="Configurações" />
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <Card className="mx-auto max-w-2xl divide-y p-0">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="truncate font-medium">{v}</span>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
