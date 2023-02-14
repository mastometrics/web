import { APIEvent } from "solid-start";
import { logout } from "~/db/session";

export function GET({ request }: APIEvent) {
  return logout(request);
}
