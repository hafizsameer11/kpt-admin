/** Client-side CSV download for admin exports (UTF-8 BOM for Excel). */

function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown> | Record<string, unknown>>,
): number {
  const lines: string[] = [headers.map(escapeCsvCell).join(",")];

  for (const row of rows) {
    if (Array.isArray(row)) {
      lines.push(row.map(escapeCsvCell).join(","));
    } else {
      lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
    }
  }

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return rows.length;
}
