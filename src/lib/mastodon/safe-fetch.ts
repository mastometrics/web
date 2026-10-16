import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { HandledError } from "../error";

// Instance hosts come from users, so requests to them must never reach the private network of the server
// (other services, cloud metadata endpoints like 169.254.169.254, ...)
const blocked = new BlockList();
const blockedIpv4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, broadcast
];
const blockedIpv6: [string, number][] = [
  ["::", 127], // unspecified and loopback
  ["64:ff9b::", 96], // NAT64
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];
blockedIpv4.forEach(([network, prefix]) => blocked.addSubnet(network, prefix, "ipv4"));
blockedIpv6.forEach(([network, prefix]) => blocked.addSubnet(network, prefix, "ipv6"));

/** A DNS name with at least one dot and a TLD that starts with a letter, so no IP addresses or `localhost` */
const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/i;

export const dns = {
  /** Replaceable in tests, which shouldn't depend on real DNS */
  lookup: (hostname: string) => lookup(hostname, { all: true, verbatim: true }),
};

/** IPv4-mapped IPv6 addresses (::ffff:127.0.0.1) are matched against the IPv4 rules by BlockList */
export function isPublicAddress(address: string) {
  const family = isIP(address);
  return family !== 0 && !blocked.check(address, family === 4 ? "ipv4" : "ipv6");
}

/** Throws unless the url is https on the default port of a public host name that only resolves to public addresses */
export async function assertPublicUrl(input: string | URL) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new HandledError("Invalid instance url", { status: 400 });
  }
  if (url.protocol !== "https:" || url.port || url.username || url.password || !HOSTNAME.test(url.hostname))
    throw new HandledError(`${url.host || "This"} is not a valid Mastodon instance`, { status: 400 });

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(url.hostname);
  } catch {
    throw new HandledError(`Could not find ${url.hostname}`, { status: 404 });
  }
  if (!addresses.length || !addresses.every(({ address }) => isPublicAddress(address)))
    throw new HandledError(`${url.hostname} is not a valid Mastodon instance`, { status: 400 });
}

const MAX_REDIRECTS = 3;

/**
 * `fetch` for user supplied hosts: only public hosts, and redirects are followed manually so every hop is checked too.
 * The Authorization header is only sent to the original host.
 */
export async function safeFetch(input: string, init: RequestInit = {}, redirects = MAX_REDIRECTS): Promise<Response> {
  await assertPublicUrl(input);
  const response = await fetch(input, { ...init, redirect: "manual" });

  const location = response.headers.get("location");
  if (response.status < 300 || response.status >= 400 || !location) return response;
  if (redirects <= 0) throw new HandledError(`Too many redirects from ${new URL(input).host}`);

  const next = new URL(location, input);
  const headers = new Headers(init.headers);
  if (next.host !== new URL(input).host) headers.delete("authorization");
  // Like browsers, a 303 (and a 301/302 after a POST) continues with a GET
  const asGet =
    response.status === 303 || ((response.status === 301 || response.status === 302) && init.method === "POST");
  return safeFetch(
    next.href,
    { ...init, headers, ...(asGet ? { method: "GET", body: undefined } : {}) },
    redirects - 1
  );
}
