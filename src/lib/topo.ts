import { createContext, useContext, type MutableRefObject } from "react";

/**
 * O que a tela aberta mostra na faixa verde do topo (BarraSuperior).
 * As telas não usam isto direto: o <PageHeader> preenche sozinho.
 */
export type InfoTopo = {
  titulo: string;
  subtitulo?: string | undefined;
  /** A tela tem exportação: mostra o botão Exportar (⤓) na faixa verde. */
  temExportar: boolean;
  exportarDesabilitado: boolean;
};

export type ContextoTopo = {
  info: InfoTopo | null;
  setInfo: (i: InfoTopo | null) => void;
  /** Função de exportação da tela aberta (ref para não re-renderizar a barra a cada render). */
  exportarRef: MutableRefObject<(() => void) | undefined>;
};

export const TopoContext = createContext<ContextoTopo | null>(null);

export function useTopo(): ContextoTopo {
  const ctx = useContext(TopoContext);
  if (!ctx) throw new Error("useTopo precisa estar dentro de <TopoProvider>.");
  return ctx;
}
