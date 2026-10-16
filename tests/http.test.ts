// End-to-end tests against the production build (`npm run build` first, skipped otherwise)
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createSessionValue } from "~/backend/session";
import { resetDatabase, seedDatabase } from "./seed";

const entry = new URL("../dist/server/entry.mjs", import.meta.url);
const built = existsSync(entry);

let server: ChildProcess;
let base: string;
let admin: string;
let user: string;

async function freePort() {
  return new Promise<number>((resolve) => {
    const srv = createServer().listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

describe.skipIf(!built)("http", () => {
  beforeAll(async () => {
    const port = await freePort();
    base = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [entry.pathname], {
      env: { ...process.env, HOST: "127.0.0.1", PORT: `${port}` },
      stdio: "pipe",
    });
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(`${base}/internal-api/health`)).ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error("Server did not start");
  });

  afterAll(() => {
    server?.kill();
  });

  beforeEach(async () => {
    await resetDatabase();
    const seeded = await seedDatabase();
    admin = `mm_session=${createSessionValue(seeded.admin.id)}`;
    user = `mm_session=${createSessionValue(seeded.user.id)}`;
  });

  const get = (path: string, cookie?: string) =>
    fetch(`${base}${path}`, { redirect: "manual", headers: cookie ? { cookie } : {} });

  const action = (name: string, body: unknown, cookie?: string) =>
    fetch(`${base}/_actions/${name}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    });

  it("serves public pages", async () => {
    for (const path of ["/", "/faq", "/privacy", "/self-hosting", "/auth/login"])
      expect((await get(path)).status, path).toBe(200);
    expect((await get("/does-not-exist")).status).toBe(404);
    expect(await (await get("/internal-api/health")).text()).toBe("ping");
  });

  it("redirects anonymous users away from the dashboard", async () => {
    for (const path of ["/dashboard", "/dashboard/demo@mas.to", "/dashboard/settings", "/admin"]) {
      const response = await get(path);
      expect(response.status, path).toBe(302);
      expect(response.headers.get("location"), path).toContain("/auth/login");
    }
  });

  it("only shows users their own dashboard", async () => {
    expect((await get("/dashboard/other@mas.to", user)).status).toBe(200);
    const response = await get("/dashboard/demo@mas.to", user);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("/dashboard/other@mas.to");
    expect((await get("/admin", user)).status).toBe(302);
  });

  it("lets admins see everything without leaking tokens", async () => {
    for (const path of [
      "/dashboard/demo@mas.to",
      "/dashboard/other@mas.to",
      "/dashboard/demo@mas.to/people",
      "/admin",
    ]) {
      const response = await get(path, admin);
      expect(response.status, path).toBe(200);
      const html = await response.text();
      expect(html).not.toContain("secret-user-token");
      expect(html).not.toContain("other-user-token");
    }
  });

  it("returns 404 for unknown accounts", async () => {
    expect((await get("/dashboard/nobody@mas.to", admin)).status).toBe(404);
  });

  it("server renders statuses", async () => {
    const html = await (await get("/dashboard/demo@mas.to", admin)).text();
    expect(html).toContain("Post number");
    expect(html).not.toContain("alert(1)");
  });

  it("ignores forged session cookies", async () => {
    const forged = `mm_session=${Buffer.from(JSON.stringify({ userId: "1" })).toString("base64url")}.forged`;
    expect((await get("/dashboard", forged)).headers.get("location")).toContain("/auth/login");
  });

  it("enforces permissions on actions", async () => {
    const params = { handle: "demo@mas.to", period: "all", order: "engagements" };
    expect((await action("statuses", params)).status).toBe(401);
    expect((await action("statuses", params, user)).status).toBe(403);
    const response = await action("statuses", params, admin);
    expect(response.status).toBe(200);

    expect((await action("listUsers", {}, user)).status).toBe(403);
    expect((await action("deleteAccount", { handle: "demo@mas.to" }, user)).status).toBe(403);
    expect((await action("syncAccount", { handle: "other@mas.to" }, user)).status).toBe(403);
    expect((await action("topPeople", { accountId: 1, order: "reach" }, user)).status).toBe(403);
  });

  it("validates action input", async () => {
    expect((await action("statuses", { handle: "demo@mas.to", period: "forever", order: "x" }, admin)).status).toBe(
      400
    );
  });

  it("lets users delete their own account", async () => {
    expect((await action("deleteAccount", { handle: "other@mas.to" }, user)).status).toBe(200);
    // The session is now invalid
    expect((await get("/dashboard", user)).headers.get("location")).toContain("/auth/login");
  });

  it("logs out", async () => {
    const response = await get("/auth/logout", admin);
    expect(response.status).toBe(302);
    expect(response.headers.get("set-cookie")).toMatch(/mm_session=deleted;.*Expires=Thu, 01 Jan 1970/);
  });
});
