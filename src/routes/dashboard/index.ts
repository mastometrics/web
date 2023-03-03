import { APIEvent, redirect } from "solid-start";
import { getUser } from "~/backend/session";

export async function GET({ request }: APIEvent) {
  const user = await getUser(request);
  if (user?.account) throw redirect(`/dashboard/${user.account.username}`);
  else throw redirect("/auth/login");
}
