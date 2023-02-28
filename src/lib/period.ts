export type periodKeys = "24h" | "7d" | "30d" | "90d" | "1y" | "all";
export const periodToDaysAgo: Record<periodKeys, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: 0,
} as const;

export function periodToDate(period: periodKeys) {
  if (period == "all") return undefined;
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * periodToDaysAgo[period]);
}
