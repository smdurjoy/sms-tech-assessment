const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
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
  return gbp.format(amount);
}

export function formatDate(value: Date | string | number): string {
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: Date | string | number): string {
  return dateTimeFmt.format(new Date(value));
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
