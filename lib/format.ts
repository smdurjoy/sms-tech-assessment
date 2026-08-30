const bdt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}৳${bdt.format(Math.abs(amount))}`;
}

export function formatDate(value: Date | string | number): string {
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: Date | string | number): string {
  return dateTimeFmt.format(new Date(value));
}

/** Human-readable file size for submission listings. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/** For prefilling <input type="date"> / "datetime-local" values. */
export function toDateInputValue(value: Date | string | number): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function toDateTimeInputValue(value: Date | string | number): string {
  const d = new Date(value);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
