import { Account } from "@prisma/client";
import { LogSnag } from "logsnag";

const logsnagEnabled = process.env.LOGSNAG_TOKEN != null;
const logsnag = new LogSnag({
  token: `${process.env.LOGSNAG_TOKEN}`,
  project: "mastometrics",
});

export async function logNewUser(account: Account) {
  if (!logsnagEnabled) return;
  await logsnag.publish({
    channel: "users",
    event: "New sign up",
    description: `${account.username} (${account.followersCount} followers)`,
    icon: getIconForCount(account.followersCount),
    notify: true,
    tags: {
      instance: account.instance,
      username: account.username,
    },
  });
}

export async function logDeletedUser(account: Account) {
  if (!logsnagEnabled) return;
  await logsnag.publish({
    channel: "users",
    event: "Account deleted",
    description: `${account.username}`,
    icon: "💔",
    notify: true,
    tags: {
      instance: account.instance,
      username: account.username,
    },
  });
}

const hypeIcons = {
  0: "🍼",
  50: "🌱",
  100: "🌿",
  500: "🌵",
  1000: "🌴",
  5000: "🔥",
  10000: "🌋",
};

function getIconForCount(count?: number | null) {
  return (
    Object.entries(hypeIcons)
      .reverse()
      .find(([key]) => (count ?? 0) >= Number(key))?.[1] || "🍼"
  );
}
