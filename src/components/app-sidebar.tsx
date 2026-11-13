import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Landmark,
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
  const { isFromPortal, voltarAoPortal } = useAuth();

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
    <Sidebar collapsible="icon" className="z-50 group-data-[side=left]:border-r-0">
      <SidebarHeader className="gap-0 p-0">
        {/* Linha 1: mesma altura da faixa verde do topo (h-14). */}
        <div
          className={`flex h-14 shrink-0 items-center ${collapsed ? "justify-center px-0" : "px-2"}`}
        >
          {isFromPortal && (
            <button
              type="button"
              onClick={voltarAoPortal}
              title="Voltar ao Portal"
              className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-transparent text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                collapsed ? "h-10 w-10 p-0" : "h-10 w-full px-4"
              }`}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Voltar ao Portal</span>}
            </button>
          )}
        </div>
        {/* Linha 2: logo e nome da ferramenta. */}
        <div
          className={`flex h-[72px] shrink-0 items-center gap-3 ${collapsed ? "justify-center px-0" : "px-3"}`}
        >
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
        <div className="flex items-center justify-center px-1">
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
