import { AuthenticatedUser } from "~/backend/authentication";
export enum Roles {
  Admin = "admin",
}
export function usePermissions(user?: AuthenticatedUser | null) {
  const isAdmin = user?.roles?.includes(Roles.Admin);
  const viewAccount = (usernameOrId: string | number) => {
    if (!user?.account) return false;
    if (isAdmin) return true;
    if (typeof usernameOrId === "number") return user.account.id === usernameOrId;
    if (typeof usernameOrId === "string") return user.account.username.toLowerCase() === usernameOrId.toLowerCase();
  };
  const manage = () => isAdmin;
  return { manage, account: { view: viewAccount, edit: viewAccount } };
}
