// HTML helpers that work with any DOMParser implementation (browser or linkedom on the server)
import type { MastodonStatus } from "./types";

type DOMParserLike = { parseFromString(html: string, type: "text/html"): Document };

export const defaultClassmap: Record<string, string[]> = {
  mention: ["text-mastodon"],
  hashtag: ["text-mastodon"],
  invisible: ["hidden"],
  ellipsis: ["truncate"],
};

export const defaultElementClassmap: Record<string, string[]> = {
  a: ["text-mastodon-purple-600", "dark:text-mastodon-purple-300", "hover:underline"],
  p: ["text-gray-700", "dark:text-mastodon-purple-100", "last-child:mb-0", "mb-2"],
};

const SAFE_TAG = ["a", "p", "br", "span", "body"];
const SAFE_ATTR = ["href", "rel", "target", "class"];
const SAFE_CLASS = ["mention", "hashtag", "ellipsis", "invisible"]; //https://docs.joinmastodon.org/spec/activitypub/#sanitization
const TEXT_NODE = 3;

function parse(parser: DOMParserLike, html: string) {
  return parser.parseFromString(`<!doctype html><html lang="en"><body>${html}</body></html>`, "text/html");
}

export function sanitizeMastodonHtml(
  parser: DOMParserLike,
  html: string,
  classmap: Record<string, string[]> = defaultClassmap,
  elementClassmap: Record<string, string[]> = defaultElementClassmap
) {
  const doc = parse(parser, html);

  function recursiveSanitize(node: Node) {
    if (node.nodeType === TEXT_NODE) return;

    const el = node as Element;
    const tag = el.tagName?.toLowerCase();
    if (!tag || !SAFE_TAG.includes(tag)) {
      (el as ChildNode).remove();
      return;
    }

    for (const attr of Array.from(el.attributes)) if (!SAFE_ATTR.includes(attr.name)) el.removeAttribute(attr.name);

    const href = el.getAttribute("href");
    if (href && !/^https?:\/\//i.test(href)) el.removeAttribute("href");

    for (const cls of Array.from(el.classList)) {
      if (!SAFE_CLASS.includes(cls)) el.classList.remove(cls);
      if (classmap[cls]) el.classList.add(...classmap[cls]);
    }

    if (elementClassmap[tag]) el.classList.add(...elementClassmap[tag]);

    if (tag === "a" && el.getAttribute("href")?.startsWith("http")) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }

    for (const child of Array.from(el.childNodes)) recursiveSanitize(child);
  }
  recursiveSanitize(doc.body);
  return doc.body.innerHTML;
}

export function getHtmlTextContent(parser: DOMParserLike, content: string) {
  return parse(parser, content).body.textContent || "";
}

export function formatEmojis(text: string, emojis: MastodonStatus["emojis"], trust = false) {
  text = trust ? text : escapeHtml(text);
  for (const emoji of emojis ?? []) {
    const regex = new RegExp(`:${escapeRegExp(emoji.shortcode)}:`, "g");
    text = text.replace(
      regex,
      `<img src="${escapeHtml(emoji.static_url)}" alt="${escapeHtml(emoji.shortcode)}" class="inline w-4 h-4" />`
    );
  }
  return text;
}

export function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
