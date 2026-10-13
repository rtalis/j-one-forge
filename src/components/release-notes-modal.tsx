import { useEffect, useState } from "react";
import {
  Sparkles,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  APP_VERSIONS,
  CURRENT_VERSION,
  LAST_SEEN_VERSION_KEY,
} from "@/data/versions";
import { useAuth } from "@/lib/auth";

export function openReleaseNotes() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-release-notes"));
  }
}

export function ReleaseNotesModal() {
  const { token, isAuthenticatingPortal } = useAuth();
  const isAuthenticated = !!token;
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasUnseenVersion, setHasUnseenVersion] = useState(false);

  // Escuta eventos manuais de abertura
  useEffect(() => {
    const handleOpenEvent = () => setOpen(true);
    window.addEventListener("open-release-notes", handleOpenEvent);
    return () => window.removeEventListener("open-release-notes", handleOpenEvent);
  }, []);

  // Auto-exibe na primeira vez após login se for uma versão nova ainda não vista
  useEffect(() => {
    if (!isAuthenticated || isAuthenticatingPortal) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY);
      const isUnseen =
        !lastSeen ||
        lastSeen.replace(/^v/, "").trim() !== CURRENT_VERSION.version.replace(/^v/, "").trim();
      setHasUnseenVersion(isUnseen);

      if (isUnseen) {
        timer = setTimeout(() => {
          setOpen(true);
        }, 500);
      }
    } catch {
      // ignore
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, isAuthenticatingPortal]);

  const handleClose = () => {
    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, CURRENT_VERSION.version);
      setHasUnseenVersion(false);
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <>
      {/* Indicador minimalista no canto inferior direito */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed bottom-2.5 right-3.5 z-40 flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono transition-colors cursor-pointer select-none ${
            hasUnseenVersion
              ? "text-primary font-semibold bg-primary/10 hover:bg-primary/20 border border-primary/30 shadow-xs"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
          }`}
          title="Ver notas de atualização e histórico de versões"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasUnseenVersion ? "bg-primary animate-pulse" : "bg-primary/70"
            }`}
          />
          <span>{CURRENT_VERSION.version}</span>
          {hasUnseenVersion && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-primary ml-0.5">
              Novo
            </span>
          )}
        </button>
      )}

      {/* Modal de Notas de Atualização */}
      <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : setOpen(true))}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden sm:rounded-lg border-border bg-card">
          <DialogHeader className="p-5 pb-3 text-left border-b border-border/40">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Novidades do Sistema
                </DialogTitle>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] px-1.5 py-0 text-muted-foreground bg-muted border-border/50"
                >
                  {CURRENT_VERSION.version}
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Confira as melhorias e correções recentes no Finfisc.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] px-5 py-4">
            <div className="space-y-4">
              {/* Versão Atual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {CURRENT_VERSION.title || `Versão ${CURRENT_VERSION.version}`}
                  </span>
                  {CURRENT_VERSION.date && (
                    <span className="text-[11px] text-muted-foreground">
                      {CURRENT_VERSION.date}
                    </span>
                  )}
                </div>

                <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                  <ul className="space-y-2">
                    {CURRENT_VERSION.notes.map((note, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Histórico de versões anteriores */}
              {APP_VERSIONS.length > 1 && (
                <div className="pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex w-full items-center justify-between py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      Histórico anterior ({APP_VERSIONS.length - 1})
                    </span>
                    {showHistory ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {showHistory && (
                    <div className="mt-2.5 space-y-2.5">
                      {APP_VERSIONS.slice(1).map((release) => (
                        <div
                          key={release.version}
                          className="rounded-md border border-border/40 bg-muted/10 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-foreground flex items-center gap-1.5">
                              <span className="font-mono text-muted-foreground">
                                {release.version}
                              </span>
                              {release.title && <span>— {release.title}</span>}
                            </span>
                            {release.date && (
                              <span className="text-muted-foreground">{release.date}</span>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {release.notes.map((note, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-[11px] text-muted-foreground leading-snug"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-5 py-2.5 border-t border-border/40 bg-muted/20 flex sm:justify-end items-center">
            <Button
              type="button"
              size="sm"
              onClick={handleClose}
              className="h-8 px-4 text-xs font-medium"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
