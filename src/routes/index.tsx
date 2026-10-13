import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: `Início | ${APP_CONFIG.name}` }] }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <PageHeader title="Início" subtitle={APP_CONFIG.subtitle} />
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <Card className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold">{APP_CONFIG.name}</h2>
          <p className="text-sm text-muted-foreground">
            Base pronta: login, portal J-One, tema, menu lateral e cliente de API. Crie suas telas em{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">src/routes</code>.
          </p>
        </Card>
      </main>
    </div>
  );
}
