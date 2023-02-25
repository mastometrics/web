import { Instance, Prisma } from "@prisma/client";
import { mastodonApi } from "~/lib/mastodon/api";
import { registerInstanceApp, fetchAppAccessToken } from "~/lib/mastodon/auth";
import { db, Result, runInConnection } from ".";

export async function findOrCreateInstance(host: string) {
  return runInConnection(async () => {
    let instance = await db.instance.findUnique({
      where: { host },
    });
    if (!instance) {
      try {
        const instanceData = await mastodonApi({ instance: host }).instance.info();
        if (!instanceData) throw new Error(`Instance ${host} not found`);

        instance = await db.instance.create({
          data: {
            host,
            name: instanceData.title,
            raw: instanceData as unknown as Prisma.JsonObject,
          },
        });
      } catch (e) {
        throw new Error(`Could not connect to instance '${host}'`);
      }
    }
    return instance;
  });
}

type InstanceAppCredentials = {
  clientId: string;
  clientSecret: string;
  token: string;
  redirectUri: string;
  scope: string;
  instance: Instance;
};
type InstanceAppOptions = {
  redirectUri?: string;
};
export async function getInstanceAppCredentials(
  instance: Instance,
  opts: InstanceAppOptions
): Result<InstanceAppCredentials>;
export async function getInstanceAppCredentials(host: string, opts: InstanceAppOptions): Result<InstanceAppCredentials>;
export async function getInstanceAppCredentials(
  hostOrInstance: string | Instance,
  { redirectUri }: InstanceAppOptions
): Result<InstanceAppCredentials> {
  return runInConnection(async () => {
    let instance: Instance;
    if (typeof hostOrInstance === "string") {
      const [ins, err] = await findOrCreateInstance(hostOrInstance);
      if (err) throw err;
      instance = ins;
    } else instance = hostOrInstance;
    // const instance = typeof hostOrInstance === "string" ? await findOrCreateInstance(hostOrInstance) : hostOrInstance;
    if (
      instance.token &&
      instance.clientId &&
      instance.clientSecret &&
      (redirectUri == undefined || (instance.rawClient as Prisma.JsonObject)["redirect_uri"] === redirectUri)
    ) {
      return {
        clientId: instance.clientId,
        clientSecret: instance.clientSecret,
        token: instance.token,
        redirectUri: (instance.rawClient as Prisma.JsonObject)["redirect_uri"] as string,
        scope: (instance.rawClient as Prisma.JsonObject)["scopes"] as string,
        instance,
      };
    } else if (redirectUri) {
      const client = await registerInstanceApp(instance.host, {
        clientName: "Toeter Toeter Toeter, met romana op de scooter",
        redirectUris: redirectUri,
        scopes: "read",
      });
      const token = await fetchAppAccessToken(instance.host, {
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUri,
      });
      await db.instance.update({
        where: { id: instance.id },
        data: {
          clientId: client.client_id,
          clientSecret: client.client_secret,
          token: token.access_token,
          rawClient: client as unknown as Prisma.JsonObject,
        },
      });

      return {
        clientId: client.client_id,
        clientSecret: client.client_secret,
        token: token.access_token,
        redirectUri: redirectUri,
        scope: client.scopes,
        instance,
      };
    } else if (!redirectUri) throw new Error("Missing redirect uri while trying to register instance app");
    throw new Error("Instance not configured");
  });
}
