const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});
export function formatDate(date: Date | string) {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});
export function formatDateTime(date: Date | string) {
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});
export function formatRelativeTime(date: Date | string | undefined) {
  if (!date) return "";
  if (typeof date === "string") date = new Date(date);
  const diff = new Date(date).getTime() - Date.now();
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

export function formatHandle(acct: string, defaultInstance: string) {
  if (acct.startsWith("@")) acct = acct.slice(1);
  if (acct.includes("@")) return acct;
  return `${acct}@${defaultInstance}`;
}

export function parseHandle(handle: string) {
  const username = handle.startsWith("@") ? handle.slice(1) : handle;
  const [acct, instance] = username.split("@");
  return { acct, instance, username };
}

export function sum(...values: (number | null)[]) {
  return values.reduce((a, b) => ((a as number) + (b || 0)) as number, 0);
}

export function truncateDate(date: Date | string, truncateTo: "day" | "hour" = "day") {
  const turncated = new Date(date);
  if (truncateTo == "day") turncated.setHours(0);
  turncated.setMinutes(0, 0, 0);
  return turncated;
}
