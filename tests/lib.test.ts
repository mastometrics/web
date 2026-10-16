import { describe, expect, it } from "vitest";
import { createSessionValue, readSessionValue } from "~/backend/session";
import { formatHandle, formatNumber, parseHandle, parseInstance, sum, truncateDate } from "~/lib/format";
import { formatEmojis } from "~/lib/mastodon/html";
import { getTextContent, simpleMastodonSanitizer } from "~/lib/mastodon/html.server";
import { periodToDate } from "~/lib/period";
import { Roles, usePermissions } from "~/lib/permissions";
import type { AuthenticatedUser } from "~/backend/authentication";
import { estimateImportDuration, mapMetricsToDelta, mapMetricsToProgression } from "~/lib/dashboard";

describe("format", () => {
  it("parses handles", () => {
    expect(parseHandle("@robertvh@mas.to")).toEqual({
      acct: "robertvh",
      instance: "mas.to",
      username: "robertvh@mas.to",
    });
    expect(formatHandle("robertvh", "mas.to")).toBe("robertvh@mas.to");
  });

  it("parses instances from user input", () => {
    expect(parseInstance("user@mas.to")).toBe("mas.to");
    expect(parseInstance("@user@mastodon.social ")).toBe("mastodon.social");
    expect(parseInstance("https://fosstodon.org/@someone")).toBe("fosstodon.org");
    expect(parseInstance("mas.to")).toBe("mas.to");
    expect(parseInstance("")).toBeUndefined();
  });

  it("formats numbers and sums", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(null)).toBe("");
    expect(sum(1, null, 2)).toBe(3);
  });

  it("truncates dates", () => {
    const date = truncateDate(new Date(2024, 0, 2, 13, 45, 12), "hour");
    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([13, 0, 0]);
    expect(truncateDate(new Date(2024, 0, 2, 13, 45), "day").getHours()).toBe(0);
  });

  it("converts periods to dates", () => {
    expect(periodToDate("all")).toBeUndefined();
    const sevenDaysAgo = periodToDate("7d")!.getTime();
    expect(Math.abs(Date.now() - 7 * 24 * 3600 * 1000 - sevenDaysAgo)).toBeLessThan(1000);
  });
});

describe("sessions", () => {
  it("round trips signed session values", () => {
    const value = createSessionValue(42);
    expect(readSessionValue(value)).toBe("42");
  });

  it("rejects tampered or foreign session values", () => {
    const value = createSessionValue(42);
    const [payload] = value.split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "1" })).toString("base64url");
    expect(readSessionValue(`${forged}.${value.split(".")[1]}`)).toBeNull();
    expect(readSessionValue(`${payload}.invalid`)).toBeNull();
    expect(readSessionValue(createSessionValue(42, "another-secret"))).toBeNull();
    expect(readSessionValue("garbage")).toBeNull();
    expect(readSessionValue(undefined)).toBeNull();
  });
});

describe("permissions", () => {
  const user = (roles: Roles[] = []) =>
    ({ id: 1, roles, account: { id: 7, username: "Demo@mas.to" } }) as unknown as AuthenticatedUser;

  it("lets users view only their own account", () => {
    const can = usePermissions(user());
    expect(can.account.view("demo@mas.to")).toBe(true);
    expect(can.account.view(7)).toBe(true);
    expect(can.account.view("other@mas.to")).toBe(false);
    expect(can.account.view(8)).toBe(false);
    expect(can.manage()).toBeFalsy();
  });

  it("lets admins view and manage everything", () => {
    const can = usePermissions(user([Roles.Admin]));
    expect(can.account.view("other@mas.to")).toBe(true);
    expect(can.manage()).toBe(true);
  });

  it("denies anonymous users", () => {
    expect(usePermissions(null).account.view("demo@mas.to")).toBe(false);
  });
});

describe("mastodon html", () => {
  it("removes unsafe tags, attributes and links", () => {
    const html = simpleMastodonSanitizer(
      `<p onclick="x()">Hi <a href="javascript:alert(1)">bad</a> <a href="https://mas.to/tags/x" class="mention hashtag evil">#x</a></p><script>alert(1)</script><img src=x onerror=alert(1)>`
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("evil");
    expect(html).toContain('href="https://mas.to/tags/x"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("hashtag");
  });

  it("extracts text content", () => {
    expect(getTextContent("<p>@someone hello <b>world</b></p>")).toBe("@someone hello world");
  });

  it("replaces custom emojis and escapes text", () => {
    const html = formatEmojis(`<b>hi</b> :blobcat:`, [{ shortcode: "blobcat", static_url: "https://e/blob.png" }]);
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain('<img src="https://e/blob.png" alt="blobcat"');
  });
});

describe("ui helpers", () => {
  it("estimates import durations", () => {
    expect(estimateImportDuration(0)).toEqual({ statuses: 0, seconds: 15 });
    expect(estimateImportDuration(5000).statuses).toBe(2000);
  });

  it("maps metrics to progressions and deltas", () => {
    const metrics = [
      { date: new Date("2024-01-01"), engagements: 10, followers: 1 },
      { date: new Date("2024-01-02"), engagements: 15, followers: 2 },
      { date: new Date("2024-01-03"), engagements: 25, followers: 4 },
    ] as any[];
    expect(mapMetricsToProgression(metrics, "followers").map((m) => m.value)).toEqual([1, 2, 4]);
    expect(mapMetricsToDelta(metrics, "engagements").map((m) => m.value)).toEqual([5, 10]);
    expect(mapMetricsToProgression([], "followers", 9)[0].value).toBe(9);
  });
});
