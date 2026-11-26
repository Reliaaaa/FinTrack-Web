import { monthKey, nextOccurrence, type Entry, type FinanceData, type Recurring } from './finance';
import { monthLabel, rupiah } from './format';

const entryLabels = { income: 'Pemasukan', expense: 'Pengeluaran', transfer: 'Transfer' } as const;
const columns = ['Tanggal', 'Tipe', 'Judul', 'Kategori', 'Dompet asal', 'Nominal (IDR)', 'Catatan', 'Dompet tujuan'];

export function transactionRows(data: FinanceData, entries: readonly Entry[]) {
  const wallets = new Map(data.wallets.map(wallet => [wallet.id, wallet.name]));
  return [...entries].sort((a, b) => b.date.localeCompare(a.date)).map(entry => ({
    id: entry.id,
    date: entry.date,
    kind: entry.type,
    type: entryLabels[entry.type],
    title: entry.title,
    category: entry.category,
    source: wallets.get(entry.walletId) ?? '',
    amount: entry.amount,
    note: entry.note ?? '',
    destination: entry.targetWalletId ? wallets.get(entry.targetWalletId) ?? '' : '',
  }));
}

export function transactionTotals(entries: readonly Entry[]) {
  const totals = { income: 0, expense: 0, transfer: 0 };
  for (const entry of entries) totals[entry.type] += entry.amount;
  return { ...totals, net: totals.income - totals.expense };
}

function escapeCsv(value: string | number) {
  if (typeof value === 'number') return String(value);
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvText(data: FinanceData, entries: readonly Entry[]) {
  const rows = transactionRows(data, entries).map(row => [
    row.date, row.type, row.title, row.category, row.source, row.amount, row.note, row.destination,
  ]);
  return '\uFEFF' + [columns, ...rows].map(row => row.map(escapeCsv).join(',')).join('\r\n') + '\r\n';
}

function exportName(extension: string, period?: Date) {
  return `fintrack-transaksi${period ? '-' + monthKey(period) : ''}.${extension}`;
}

export function downloadCsv(data: FinanceData, entries: readonly Entry[], period?: Date) {
  download(new Blob([csvText(data, entries)], { type: 'text/csv;charset=utf-8' }), exportName('csv', period));
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
const spreadsheetNs = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationshipNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const worksheetType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';

function xmlText(value: string) {
  // XML 1.0 excludes these controls even when they are present in a pasted note.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

type Cell = readonly [value: string | number, style: number];
const cellStyle = { title: 1, subtitle: 2, header: 3, text: 4, currency: 5, date: 6, metric: 7, count: 8 } as const;

function sheetRow(index: number, values: readonly Cell[], height: number) {
  const cells = values.map(([value, style], i) => {
    const ref = String.fromCharCode(65 + i) + index;
    return typeof value === 'number'
      ? `<c r="${ref}" s="${style}"><v>${value}</v></c>`
      : `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
  }).join('');
  return `<row r="${index}" ht="${height}" customHeight="1">${cells}</row>`;
}

function columnWidths(widths: readonly number[]) {
  return `<cols>${widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`;
}

const styles = `${xmlHeader}<styleSheet xmlns="${spreadsheetNs}">
  <numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;Rp&quot; #,##0"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>
  <fonts count="5">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="20"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="11"/><color rgb="FF49685E"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FF163832"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF235347"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F4EB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFDCEAE0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function summarySheet(entries: readonly Entry[], period?: Date) {
  const totals = transactionTotals(entries);
  const rows: Cell[][] = [
    [['FinTrack · Ringkasan Keuangan', cellStyle.title], ['', cellStyle.title]],
    [[period ? monthLabel(period) : 'Semua transaksi yang diekspor', cellStyle.subtitle]],
    [['Indikator', cellStyle.header], ['Nilai', cellStyle.header]],
    [['Jumlah transaksi', cellStyle.metric], [entries.length, cellStyle.count]],
    [['Pemasukan', cellStyle.metric], [totals.income, cellStyle.currency]],
    [['Pengeluaran', cellStyle.metric], [totals.expense, cellStyle.currency]],
    [['Arus kas bersih', cellStyle.metric], [totals.net, cellStyle.currency]],
    [['Transfer antardompet', cellStyle.metric], [totals.transfer, cellStyle.currency]],
  ];
  return `${xmlHeader}<worksheet xmlns="${spreadsheetNs}"><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>${columnWidths([34, 25])}<sheetData>${rows.map((row, i) => sheetRow(i + 1, row, i === 0 ? 33 : 24)).join('')}</sheetData><mergeCells count="2"><mergeCell ref="A1:B1"/><mergeCell ref="A2:B2"/></mergeCells></worksheet>`;
}

function detailSheet(data: FinanceData, entries: readonly Entry[]) {
  const rows = transactionRows(data, entries);
  const header = sheetRow(1, columns.map(label => [label, cellStyle.header]), 25);
  const details = rows.map((row, i) => {
    const dateSerial = Date.parse(row.date + 'T00:00:00Z') / 86_400_000 + 25569;
    const titleLines = Math.ceil(row.title.length / 30);
    const noteLines = row.note.split(/\r?\n/).reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 40)), 0);
    const rowHeight = Math.min(195, Math.max(22, 15 * titleLines, 15 * noteLines));
    return sheetRow(i + 2, [
      Number.isFinite(dateSerial) && dateSerial >= 61 ? [dateSerial, cellStyle.date] : [row.date, cellStyle.text],
      [row.type, cellStyle.text], [row.title, cellStyle.text], [row.category, cellStyle.text],
      [row.source, cellStyle.text], [row.amount, cellStyle.currency],
      [row.note, cellStyle.text], [row.destination, cellStyle.text],
    ], rowHeight);
  }).join('');
  return `${xmlHeader}<worksheet xmlns="${spreadsheetNs}"><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>${columnWidths([14, 16, 34, 23, 24, 23, 46, 24])}<sheetData>${header}${details}</sheetData><autoFilter ref="A1:H${rows.length + 1}"/></worksheet>`;
}

export async function exportWorkbook(data: FinanceData, entries: readonly Entry[], period?: Date) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `${xmlHeader}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${worksheetType}"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="${worksheetType}"/></Types>`);
  zip.file('_rels/.rels', `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipNs}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file('xl/workbook.xml', `${xmlHeader}<workbook xmlns="${spreadsheetNs}" xmlns:r="${relationshipNs}"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Ringkasan" sheetId="1" r:id="rId1"/><sheet name="Transaksi" sheetId="2" r:id="rId2"/></sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipNs}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${relationshipNs}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${relationshipNs}/styles" Target="styles.xml"/></Relationships>`);
  zip.file('xl/styles.xml', styles);
  zip.file('xl/worksheets/sheet1.xml', summarySheet(entries, period));
  zip.file('xl/worksheets/sheet2.xml', detailSheet(data, entries));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function downloadXlsx(data: FinanceData, entries: readonly Entry[], period?: Date) {
  const workbook = await exportWorkbook(data, entries, period);
  download(new Blob([new Uint8Array(workbook)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), exportName('xlsx', period));
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
