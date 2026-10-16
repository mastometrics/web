import { DOMParser } from "linkedom";
import { getHtmlTextContent, sanitizeMastodonHtml } from "./html";

const parser = new DOMParser() as unknown as globalThis.DOMParser;

/** Sanitize Mastodon HTML on the server */
export function simpleMastodonSanitizer(
  html: string,
  ...args: Parameters<typeof sanitizeMastodonHtml> extends [any, any, ...infer R] ? R : never
) {
  return sanitizeMastodonHtml(parser, html, ...args);
}

export function getTextContent(content: string) {
  return getHtmlTextContent(parser, content);
}
