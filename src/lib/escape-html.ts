const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ESCAPE_LOOKUP[character] ?? character)
