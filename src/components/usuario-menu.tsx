import { ArrowLeft, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

/** Usuário logado no canto superior direito: inicial num círculo + nome; o menu tem Sair. */
export function UsuarioMenu({ escuro }: { escuro?: boolean }) {
  const { username, signOut, isFromPortal, voltarAoPortal } = useAuth();
  if (!username) return null;
  const inicial = username.trim().charAt(0).toUpperCase() || "?";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Usuário ${username}`}
          className={
            escuro
              ? "flex h-9 max-w-[220px] items-center gap-2 rounded-full border-2 border-sidebar-border bg-sidebar-accent/40 py-0.5 pl-0.5 pr-3 text-sm text-sidebar-foreground transition-colors hover:border-sidebar-primary"
              : "flex h-9 max-w-[220px] items-center gap-2 rounded-full border-2 border-primary/30 bg-muted/60 py-0.5 pl-0.5 pr-3 text-sm transition-colors hover:border-primary"
          }
        >
          <span
            className={
              escuro
                ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
                : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            }
          >
            {inicial}
          </span>
          <span className="truncate">{username}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isFromPortal && (
          <DropdownMenuItem onSelect={voltarAoPortal}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao Portal
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
