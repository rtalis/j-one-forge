import { useEffect, type ReactNode } from "react";
import { useTopo } from "@/lib/topo";

/**
 * Cabeçalho padrão de cada tela. O título, o subtítulo e o botão Exportar vão
 * para a faixa verde do topo (BarraSuperior), numa linha só; as ações próprias
 * da tela (`actions`) ficam numa linha à direita, no topo do conteúdo.
 *
 *   <PageHeader
 *     title="Pedidos"
 *     subtitle="Abertos no mês"
 *     onExport={() => downloadCsv(...)}   // mostra o ⤓ na faixa verde
 *     actions={<Button>Novo pedido</Button>}
 *   />
 *
 * O Atualizar (↻) da faixa verde já recarrega as consultas da tela.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  onExport,
  exportDisabled = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Exportação da tela (CSV, Excel...). Sem ela, o botão Exportar não aparece. */
  onExport?: () => void;
  exportDisabled?: boolean;
}) {
  const { setInfo, exportarRef } = useTopo();
  const temExportar = !!onExport;

  // A função muda a cada render; fica na ref para a barra sempre chamar a atual.
  exportarRef.current = onExport;

  useEffect(() => {
    setInfo({
      titulo: title,
      subtitulo: subtitle,
      temExportar,
      exportarDesabilitado: exportDisabled,
    });
  }, [setInfo, title, subtitle, temExportar, exportDisabled]);

  // Saiu da tela: limpa a faixa (a próxima tela preenche de novo).
  useEffect(
    () => () => {
      setInfo(null);
      exportarRef.current = undefined;
    },
    [setInfo, exportarRef],
  );

  if (!actions) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pt-4">
      {actions}
    </div>
  );
}
