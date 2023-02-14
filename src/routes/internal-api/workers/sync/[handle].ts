import { APIEvent } from "solid-start";
import { updateUserStats } from "~/syncer";

export async function GET({ params }: APIEvent) {
  if (!params.handle) return new Response("Missing handle", { status: 400 });
  try {
    await updateUserStats(params.handle);
    return new Response("OK");
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
