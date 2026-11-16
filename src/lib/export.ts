import { nextOccurrence, type Entry, type FinanceData, type Recurring } from './finance';
import { rupiah } from './format';

export function downloadCsv(data: FinanceData, entries: Entry[]) {
  const header = ['Tanggal', 'Tipe', 'Judul', 'Kategori', 'Dompet', 'Nominal', 'Catatan'];
  const rows = entries.map(entry => [entry.date, entry.type, entry.title, entry.category, data.wallets.find(w => w.id === entry.walletId)?.name ?? '', String(entry.amount), entry.note ?? '']);
  const csv = '\uFEFF' + [header, ...rows].map(row => row.map(value => {
    const safe = /^[\s]*[=+\-@]/.test(String(value)) ? `'${value}` : String(value);
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'fintrack-transaksi.csv');
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadXlsx(data: FinanceData, entries: Entry[]) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  const columns = ['Tanggal', 'Tipe', 'Judul', 'Kategori', 'Dompet', 'Nominal', 'Catatan'];
  const rows: (string | number)[][] = [columns, ...entries.map(entry => [entry.date, entry.type, entry.title, entry.category, data.wallets.find(w => w.id === entry.walletId)?.name || '', entry.amount, entry.note || ''])];
  const cells = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    const ref = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`;
    return typeof value === 'number' ? `<c r="${ref}"><v>${value}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
  }).join('')}</row>`).join('');
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Transaksi" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${cells}</sheetData></worksheet>`);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  download(blob, 'fintrack-transaksi.xlsx');
}

export function icsText(item: Recurring) {
  const stamp = item.nextDate.replaceAll('-', '');
  const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;').replaceAll('\n', '\\n');
  const dates = [item.nextDate];
  if (item.frequency !== 'weekly') for (let index = 1; index < (item.frequency === 'monthly' ? 120 : 40); index++) dates.push(nextOccurrence(dates[index - 1], item.frequency, item.anchorDay || Number(item.nextDate.slice(-2))));
  const recurrence = item.frequency === 'weekly' ? 'RRULE:FREQ=WEEKLY' : `RDATE;VALUE=DATE:${dates.slice(1).map(date => date.replaceAll('-', '')).join(',')}`.replace(/(.{70})/g, '$1\r\n ');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FinTrack//ID', 'BEGIN:VEVENT', `UID:${item.id}@fintrack`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z')}`, `DTSTART;VALUE=DATE:${stamp}`, `SUMMARY:${escape(item.title)} — ${escape(rupiah(item.amount))}`, recurrence, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

export function downloadIcs(item: Recurring) {
  download(new Blob([icsText(item)], { type: 'text/calendar;charset=utf-8' }), `fintrack-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`);
}
