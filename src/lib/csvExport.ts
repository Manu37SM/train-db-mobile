function escapeCsvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
export function toCsv<T>(
  rows: T[],
  columns: {
    key: keyof T;
    header: string;
  }[],
): string {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(row[c.key] as string | number | null | undefined)).join(','),
  );
  return [headerLine, ...lines].join('\r\n');
}
