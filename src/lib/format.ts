const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});
export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});
export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});
export function formatRelativeTime(date: Date) {
  const diff = date.getTime() - Date.now();
  const seconds = diff / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (Math.abs(days) > 3) return dateTimeFormatter.format(date);
  if (Math.abs(days) > 1) return relativeTimeFormatter.format(Math.round(days), "day");
  if (Math.abs(hours) > 1) return relativeTimeFormatter.format(Math.round(hours), "hour");
  if (Math.abs(minutes) > 1) return relativeTimeFormatter.format(Math.round(minutes), "minute");
  return relativeTimeFormatter.format(Math.round(seconds), "second");
}

const numberFormater = new Intl.NumberFormat("en");
export function formatNumber(number: number) {
  return numberFormater.format(number);
}
