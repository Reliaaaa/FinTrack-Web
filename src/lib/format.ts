export function rupiah(amount: number, signed = false): string {
  const text = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(amount));
  return signed ? `${amount >= 0 ? '+' : '-'}${text}` : amount < 0 ? `-${text}` : text;
}

export function compact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`;
  if (Math.abs(amount) >= 1_000) return `Rp ${(amount / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  return rupiah(amount);
}

const axisNumber = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });

export function rupiahAxisTick(amount: number): string {
  const magnitude = Math.abs(amount);
  if (magnitude >= 1_000_000) return `${axisNumber.format(amount / 1_000_000)} jt`;
  if (magnitude >= 1_000) return `${axisNumber.format(amount / 1_000)} rb`;
  return axisNumber.format(amount);
}

export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}
