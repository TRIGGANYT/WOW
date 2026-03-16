// js/utils/markdown.js — replaces Angular MarkdownPipe
export function renderMarkdown(text) {
  if (!text) return '';

  let html = text;

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Code: `code`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Headers: # ## ###
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // Lists: - item or * item
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');

  return html;
}
