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

type Emojis = MastodonStatus["emojis"];

const SHORTCODE = /:([a-zA-Z0-9_]+):/g;

/** Custom emojis by shortcode, only with https image urls */
function emojiMap(emojis: Emojis) {
  return new Map((emojis ?? []).filter((emoji) => /^https:\/\//i.test(emoji.static_url)).map((e) => [e.shortcode, e]));
}

/**
 * Escapes plain text (e.g. a display name) and replaces custom emoji shortcodes with images. Emojis come from the
 * (untrusted) instance, so this is a single pass: the inserted markup is never scanned for shortcodes again.
 */
export function formatEmojis(text: string, emojis: Emojis) {
  const byShortcode = emojiMap(emojis);
  return escapeHtml(text).replace(SHORTCODE, (match, shortcode: string) => {
    const emoji = byShortcode.get(shortcode);
    return emoji
      ? `<img src="${escapeHtml(emoji.static_url)}" alt="${escapeHtml(emoji.shortcode)}" class="inline w-4 h-4" />`
      : match;
  });
}

/** Sanitizes Mastodon HTML and replaces custom emoji shortcodes in its text (never in attributes) with images */
export function sanitizeMastodonHtmlWithEmojis(parser: DOMParserLike, html: string, emojis: Emojis) {
  const doc = parse(parser, sanitizeMastodonHtml(parser, html));
  const byShortcode = emojiMap(emojis);

  const textNodes: Node[] = [];
  const collect = (node: Node) =>
    node.nodeType === TEXT_NODE ? textNodes.push(node) : node.childNodes.forEach((child) => collect(child));
  collect(doc.body);

  for (const node of textNodes) {
    const text = node.textContent ?? "";
    const parts: Node[] = [];
    let last = 0;
    for (const match of text.matchAll(SHORTCODE)) {
      const emoji = byShortcode.get(match[1]);
      if (!emoji) continue;
      parts.push(doc.createTextNode(text.slice(last, match.index)));
      const img = doc.createElement("img");
      img.setAttribute("src", emoji.static_url);
      img.setAttribute("alt", emoji.shortcode);
      img.setAttribute("class", "inline w-4 h-4");
      parts.push(img);
      last = match.index! + match[0].length;
    }
    if (!parts.length) continue;
    parts.push(doc.createTextNode(text.slice(last)));
    (node as ChildNode).replaceWith(...parts);
  }
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
