import { APIEvent } from "solid-start";
import { mastodonApi } from "~/lib/mastodon/api";

export async function GET({ params }: APIEvent) {
  if (!params.handle) return new Response("Missing handle", { status: 400 });
  try {
    const config = { instance: "mas.to" };
    const followers = mastodonApi(config).accounts.followers({ id: "109540614448945903" }, { limit: 5 });
    for await (const follower of followers) {
      console.log(follower.username);
    }

    // await backfillMetrics(params.handle);
    return new Response("OK");
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
