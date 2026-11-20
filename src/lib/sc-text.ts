// Structured-content long text -> HTML. Shared by the server mapping (sc-map.ts)
// and the browser (studio-drafts.ts), so it has no imports.

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Long-text fields are plain text; blank lines become paragraphs, all escaped. */
export function textToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
