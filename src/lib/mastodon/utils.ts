import { isServer } from "solid-js/web";
import { MastodonStatus } from ".";
import { DOMParser, parseHTML } from "linkedom?server";
import { HTMLDocument } from "linkedom/types/html/document";

export function formatEmojis(text: string, emojis: MastodonStatus["emojis"]) {
  text = escapeHtml(text);
  for (const emoji of emojis) {
    const regex = new RegExp(`:${emoji.shortcode}:`, "g");
    text = text.replace(
      regex,
      `<img src="${escapeHtml(emoji.static_url)}" alt="${escapeHtml(emoji.shortcode)}" class="inline w-4 h-4" />`
    );
  }
  return text;
}

export function simpleMastodonSanitzer(
  html: string,
  classmap: Record<string, string[]> = {
    mention: ["text-mastodon"],
    hashtag: ["text-mastodon"],
    invisible: ["hidden"],
    ellipsis: ["trunacte"],
  },
  elementClassmap: Record<string, string[]> = {
    a: ["text-mastodon-purple-600", "hover:underline"],
    p: ["text-gray-700", "my-2"],
  }
) {
  const doc = new DOMParser().parseFromString(
    `<!doctype html><html lang="en"><body>${html}</body></html>`,
    "text/html"
  );
  const SAFE_TAG = ["a", "p", "br", "span", "body"];
  const SAFE_ATTR = ["href", "rel", "target", "class"];
  const SAFE_CLASS = ["mention", "hashtag", "ellipsis", "invisible"]; //https://docs.joinmastodon.org/spec/activitypub/#sanitization

  function recursiveSanitize(node: Node) {
    if (node.nodeType === (isServer ? node.TEXT_NODE : Node.TEXT_NODE)) return;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!SAFE_TAG.includes(tag)) {
      el.remove();
      return;
    }

    for (const attr of Array.from(el.attributes)) if (!SAFE_ATTR.includes(attr.name)) el.removeAttribute(attr.name);

    for (const cls of Array.from(el.classList)) {
      if (!SAFE_CLASS.includes(cls)) el.classList.remove(cls);
      if (classmap[cls]) el.classList.add(...classmap[cls]);
    }

    if (elementClassmap[tag]) el.classList.add(...elementClassmap[tag]);

    if (el.tagName === "A" && el.getAttribute("href")?.startsWith("http")) el.setAttribute("target", "_blank");

    for (const child of Array.from(el.childNodes)) recursiveSanitize(child);
  }
  recursiveSanitize(doc.body);
  return doc.body.innerHTML;
}

export function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
