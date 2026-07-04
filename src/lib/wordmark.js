// wordmark.js — turn any word into a cover-style "logo" sticker (original styles,
// not a clone of any real wordmark). Returns an SVG data URL sized to the text.

export const WORDMARK_STYLES = [
  { id: 'chrome', label: 'Chrome' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'script', label: 'Script' },
  { id: 'pixel', label: 'Pixel' },
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function makeWordmark(text, style = 'chrome') {
  const t = esc((text || 'NOT BLUE').toUpperCase()).slice(0, 18) || 'NOT BLUE';
  const fs = 88;
  const w = Math.max(220, 70 + t.length * fs * 0.62);
  const h = 180;
  const cx = w / 2;
  const cy = h / 2 + 6;

  let defs = '';
  let body = '';

  if (style === 'chrome') {
    defs = `<linearGradient id="cr" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eaf1ff"/><stop offset="0.45" stop-color="#7aa7ff"/>
        <stop offset="0.5" stop-color="#0d2a66"/><stop offset="0.55" stop-color="#3a6cff"/>
        <stop offset="1" stop-color="#cfe0ff"/></linearGradient>`;
    body = `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
        font-weight="900" font-size="${fs}" font-style="italic" fill="url(#cr)"
        stroke="#0a1f4d" stroke-width="3" paint-order="stroke">${t}</text>`;
  } else if (style === 'bubble') {
    body = `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
        font-weight="900" font-size="${fs}" fill="#ff7fb6" stroke="#0a1f4d" stroke-width="9"
        paint-order="stroke" stroke-linejoin="round">${t}</text>
      <text x="${cx}" y="${cy}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
        font-weight="900" font-size="${fs}" fill="#ffd7ea">${t}</text>`;
  } else if (style === 'athletic') {
    body = `<text x="${cx}" y="${cy}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-style="italic"
        font-size="${fs}" fill="#eaf1ff" stroke="#3a6cff" stroke-width="6"
        paint-order="stroke" letter-spacing="-2">${t}</text>`;
  } else if (style === 'script') {
    body = `<text x="${cx}" y="${cy}" text-anchor="middle"
        font-family="'Brush Script MT','Snell Roundhand','Segoe Script',cursive"
        font-size="${fs + 14}" fill="#eaf1ff" stroke="#0a1f4d" stroke-width="3"
        paint-order="stroke">${t}</text>`;
  } else {
    // pixel — chunky mono, crisp
    body = `<text x="${cx}" y="${cy}" text-anchor="middle"
        font-family="'Courier New', monospace" font-weight="900" font-size="${fs - 8}"
        fill="#bcd2ff" stroke="#0a1f4d" stroke-width="5" paint-order="stroke"
        letter-spacing="2" style="text-rendering:optimizeSpeed">${t}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<defs>${defs}</defs>${body}</svg>`;
  return { url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, w, h };
}
