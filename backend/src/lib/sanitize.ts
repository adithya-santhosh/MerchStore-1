import sanitizeHtml from "sanitize-html";

// sanitize-html serializes its output as valid HTML, so a literal `&`/`<`/`>`
// left in the text comes back entity-encoded (it's the only encoding it
// applies with allowedTags: []). Undo that so callers get plain text, not
// HTML — otherwise "Tom & Jerry" would be stored as "Tom &amp; Jerry" and
// come out double-encoded the next time it's rendered through React or an
// email template's own escaping.
const decodeSimpleEntities = (value: string): string =>
  value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/**
 * Strips all HTML from free-text user input before it's stored — names,
 * review text, addresses and the like are never meant to carry markup, so
 * tags are removed rather than escaped. Escaping would just relocate the
 * XSS risk to whatever renders the text next (an email template, an admin
 * export, a future rich view); stripping it here removes the payload once,
 * at the only point every write path passes through.
 */
export const stripHtml = (value: string): string =>
  decodeSimpleEntities(sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })).trim();
