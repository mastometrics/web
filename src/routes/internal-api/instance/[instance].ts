import { APIEvent, json } from "solid-start";
import { getInstanceAppCredentials } from "~/db/instance";

export async function GET({ params }: APIEvent) {
  if (!params.instance) return new Response("Missing instance", { status: 400 });
  try {
    const [credentials, err] = await getInstanceAppCredentials(params.instance);
    if (err) return new Response(err.message, { status: 500 });
    return json(credentials);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
