import { useMemo, useRef, useState, type ReactNode } from "react";
import { TopoContext, type InfoTopo } from "@/lib/topo";

/** Liga o <PageHeader> de cada tela à faixa verde do topo (BarraSuperior). */
export function TopoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<InfoTopo | null>(null);
  const exportarRef = useRef<(() => void) | undefined>(undefined);
  const valor = useMemo(() => ({ info, setInfo, exportarRef }), [info]);
  return <TopoContext.Provider value={valor}>{children}</TopoContext.Provider>;
}
