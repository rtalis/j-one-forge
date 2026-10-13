import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Standard page header (sidebar trigger + title + right-side actions) used by every screen. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b bg-card">
      <div className="flex w-full items-center justify-between gap-3 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
