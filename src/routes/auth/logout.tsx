import { APIEvent } from "solid-start";
import { logout } from "~/backend/session";

export function GET({ request }: APIEvent) {
  return logout(request);
}
