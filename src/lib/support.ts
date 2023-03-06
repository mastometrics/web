import { Account } from "@prisma/client";

export function startSupport(account?: Account) {
  const baseShareUrl = account ? `https://${account.instance}/share?text=` : "https://mastodonshare.com/?text=";
  window.open(baseShareUrl + encodeURIComponent("@MastoMetrics could you help me?"), "_blank");
}
