import { AuthenticatedUser } from "~/backend/authentication";
export enum Roles {
  Admin = "admin",
}
export function usePermissions(user?: AuthenticatedUser | null) {
  const isAdmin = user?.roles.includes(Roles.Admin);
  const viewAccount = (username: string) => {
    if (!user?.account) return false;
    if (isAdmin) return true;
    return user.account.username.toLowerCase() === username.toLowerCase();
  };
  const manage = () => isAdmin;
  return { manage, account: { view: viewAccount, edit: viewAccount } };
}
