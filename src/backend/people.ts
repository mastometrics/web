import { useDatabase, Prisma, throwOnError } from "./db";

export interface PersonStats {
  interactions: number;
  mentions: number;
  boosts: number;
  favorites: number;
  reach: number;
  username: string;
  instanceAccountId: string;
  displayName?: string;
  avatar?: string;
}

export interface getTopPeopleParams {
  order?: "interactions" | "mentions" | "boosts" | "favorites" | "reach";
}

const orderKeys = ["interactions", "mentions", "boosts", "favorites", "reach"] as const;
export type getTopPeopleOrderKeys = (typeof orderKeys)[number];

export const getTopPeople = async (id: number, params?: getTopPeopleParams) =>
  throwOnError(
    await useDatabase(async (db) => {
      return await db.$queryRaw<PersonStats[]>`
SELECT 
    counts.*,
    a."displayName",
    a."avatar"
FROM (
    SELECT 
        username, 
        "instanceAccountId",
        COUNT(*)::int AS interactions, 
        COUNT(CASE WHEN "type" = 'mention' THEN "type" END)::int AS mentions, 
        COUNT(CASE WHEN "type" = 'boost' THEN "type" END)::int AS boosts, 
        COUNT(CASE WHEN "type" = 'favorite' THEN "type" END)::int AS favorites,
        SUM(reach)::int AS reach
    FROM "interactions"
    WHERE "accountId" = ${id}
    GROUP BY username, "accountId", "instanceAccountId"
) AS counts    
LEFT JOIN "cached_accounts" a ON a.username = counts.username AND "hostInstance" = (SELECT instance FROM accounts WHERE id = ${id})
ORDER BY ${Prisma.raw(`${orderKeys.includes(params!.order!) ? params!.order! : "interactions"}`)} DESC
LIMIT 30
;`;
    })
  );
