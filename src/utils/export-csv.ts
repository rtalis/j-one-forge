/** Generic CSV export (Brazilian format: ';' delimiter, UTF-8 with BOM for Excel). */
function escapeCell(cell: unknown): string {
  if (cell === undefined || cell === null) return '""';
  return `"${String(cell).replace(/"/g, '""')}"`;
}

export function formatNumberBr(val?: number | null, digits = 2): string {
  if (val === undefined || val === null || Number.isNaN(val)) return "—";
  return val.toFixed(digits).replace(".", ",");
}

export function downloadCsv(headers: string[], rows: unknown[][], fileName: string) {
  if (rows.length === 0) return;
  const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
