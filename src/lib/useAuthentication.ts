import { createServerData$, redirect } from "solid-start/server";
import { getUser } from "~/db/session";

export const useAuthentication = () =>
  createServerData$(async (_, { request }) => {
    const user = await getUser(request);
    if (!user) throw redirect("/auth/login");
    const { account, isAdmin } = user;
    return { account, isAdmin };
  });
