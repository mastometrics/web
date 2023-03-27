import { Account } from "@prisma/client";

export function startSupport(account?: Account | null, message = "could you help me?") {
  const baseShareUrl = account ? `https://${account.instance}/share?text=` : "https://mastodonshare.com/?text=";
  window.open(baseShareUrl + encodeURIComponent(`@MastoMetrics@mas.to ${message}`), "_blank");
}
