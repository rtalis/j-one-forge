import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Modelos de carregamento com shimmer (efeito `animate-shimmer` do Skeleton).
 * Use enquanto a consulta carrega pela primeira vez, no lugar de um spinner:
 *
 *   {query.isLoading ? <TableSkeletonRows columns={4} /> : rows.map(...)}
 */

/** Linhas de tabela em shimmer, para ir dentro do <tbody>. */
export function TableSkeletonRows({
  columns,
  rows = 8,
  alignRight = [],
}: {
  columns: number;
  rows?: number;
  /** Índices das colunas numéricas (alinhadas à direita). */
  alignRight?: number[];
}) {
  // Larguras variadas para parecer conteúdo real, sempre as mesmas por célula.
  const widths = ["w-10", "w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-5/6"];
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} aria-hidden>
          {Array.from({ length: columns }, (_, c) => (
            <td key={c} className="border-b px-3 py-2.5">
              <Skeleton
                className={cn(
                  "h-3",
                  widths[(r + c * 3) % widths.length],
                  alignRight.includes(c) && "ml-auto",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Grade de cards em shimmer (dashboards, indicadores). */
export function CardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Tela inteira em shimmer (sidebar + cabeçalho + conteúdo), para o boot do app. */
export function AppShellSkeleton({ message }: { message?: string | undefined }) {
  return (
    <div className="flex min-h-screen bg-background" role="status" aria-live="polite">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 md:flex">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="ml-auto h-8 w-24" />
        </div>
        <div className="flex-1 space-y-4 px-6 py-4">
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <CardsSkeleton />
          <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className={cn("h-3", i % 2 ? "w-5/6" : "w-full")} />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">{message ?? "Carregando..."}</span>
    </div>
  );
}
