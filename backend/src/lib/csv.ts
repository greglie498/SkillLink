const FORMULA_START = /^[=+\@\t\r]/;

export function csvCell(value: unknown): string {
    if (value === null ||  value === undefined) return '';
    let s = value instanceof Date ? value.toISOString() : String(value);
    if (typeof value === 'string' && FORMULA_START.test(s)) s = `'${s}`;
    if  (/[", \n\r]/.test(s)) s = `"${s.replace(/"/g, '"')}"`;
    return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
    return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}