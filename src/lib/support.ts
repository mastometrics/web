import type { Account } from "~/generated/prisma/client";

/** The support handle is rendered into a meta tag by the base layout, so it can be configured at runtime */
export function getContactHandle() {
  if (typeof document === "undefined") return "MastoMetrics@mas.to";
  return document.querySelector<HTMLMetaElement>('meta[name="mm:contact"]')?.content || "MastoMetrics@mas.to";
}

export function startSupport(account?: Pick<Account, "instance"> | null, message = "could you help me?") {
  const baseShareUrl = account ? `https://${account.instance}/share?text=` : "https://mastodonshare.com/?text=";
  window.open(baseShareUrl + encodeURIComponent(`@${getContactHandle()} ${message}`), "_blank");
}
