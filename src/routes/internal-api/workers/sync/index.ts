import { APIEvent } from "solid-start";
import { updateOutdatedUsers, updateUserStats } from "~/syncer";

export async function GET({ params }: APIEvent) {
  try {
    updateOutdatedUsers();
    return new Response("OK");
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
