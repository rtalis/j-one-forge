import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/login-screen";
import { Toaster } from "@/components/ui/sonner";
import { ReleaseNotesModal } from "@/components/release-notes-modal";
import { Loader2 } from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { getBasepath } from "../lib/basepath";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("Root Error Boundary caught:", error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    
    // Safety net for 401s that crash the entire route tree
    const message = error instanceof Error ? error.message : String(error);
    const is401 = 
      message.includes("401") || 
      message.includes("Unauthorized") ||
      (typeof error === "object" && error !== null && (error as { status?: number }).status === 401);

    if (is401 && document.documentElement.dataset['authRedirecting'] !== "true") {
      document.documentElement.dataset['authRedirecting'] = "true";
      localStorage.removeItem(APP_CONFIG.storageKey); // Direct removal since we might be outside AuthProvider context
      window.location.replace(getBasepath() ?? "/");
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href={getBasepath() ?? "/"}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_CONFIG.name },
      { name: "description", content: APP_CONFIG.subtitle },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  const { token, ready, isAuthenticatingPortal } = useAuth();

  if (!ready || isAuthenticatingPortal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {isAuthenticatingPortal && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Autenticando via Portal J-One...
          </p>
        )}
      </div>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <SidebarProvider className="h-svh min-h-svh max-h-svh overflow-hidden">
      <div className="relative flex h-full w-full overflow-hidden">
        <AppSidebar />
        <main className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-auto">
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>
      </div>
      <ReleaseNotesModal />
    </SidebarProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="bottom-right" />
        <AppShell />
      </QueryClientProvider>
    </AuthProvider>
  );
}
