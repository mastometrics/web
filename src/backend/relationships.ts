import { getApiInstanceForAccount } from "./account";

export async function getRelationships(accountId: number, relatedInstanceAccountIds: string[]) {
  if (relatedInstanceAccountIds.length === 0) return [];
  return (await getApiInstanceForAccount(accountId)).accounts.relationships({ ids: relatedInstanceAccountIds });
}
