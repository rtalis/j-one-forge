import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Landmark,
  LogOut,
  Settings,
  Table2,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { APP_CONFIG } from "@/app.config";
import { useAuth } from "@/lib/auth";

type NavItem = { title: string; url: string; icon: LucideIcon };

/** Main navigation — add your tool's pages here (and a file in src/routes/). */
const mainItems: NavItem[] = [
  { title: "Início", url: "/", icon: LayoutDashboard },
  { title: "Exemplo de Tabela", url: "/exemplo-tabela", icon: Table2 },
];

/** Bottom "Sistema" group. */
const systemItems: NavItem[] = [{ title: "Configurações", url: "/configuracoes", icon: Settings }];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) => currentPath === path;
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { username, signOut, isFromPortal, voltarAoPortal } = useAuth();

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="z-50 border-r border-sidebar-border shadow-2xl">
      <SidebarHeader className="border-b border-sidebar-border">
        {isFromPortal && (
          <div className="pt-1 pb-1">
            <button
              type="button"
              onClick={voltarAoPortal}
              title="Voltar ao Portal"
              className={`flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium cursor-pointer shadow-xs ${
                collapsed ? "h-8 w-8 p-0 justify-center mx-auto" : "h-7 px-2.5 justify-start text-xs"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-sidebar-primary" />
              {!collapsed && <span>Voltar ao Portal</span>}
            </button>
          </div>
        )}
        <div className={`flex items-center gap-3 py-2 ${collapsed ? "px-0 justify-center" : "px-1"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Landmark className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                {APP_CONFIG.name}
              </div>
              <div className="truncate text-xs leading-tight text-sidebar-foreground/70">
                {APP_CONFIG.subtitle}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(systemItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && username && (
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <span className="truncate text-xs text-sidebar-foreground/70">{username}</span>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sair"
              className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className={`flex items-center px-1 ${collapsed ? "justify-center" : "justify-end"}`}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className={
              collapsed
                ? "mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                : "flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
