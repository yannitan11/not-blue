// gallery.js — remembers up to 6 finished covers (as JPEGs) for the EP grid.
// Kept small so it fits comfortably in localStorage.

const KEY = 'nb.gallery';
const MAX = 6;

export function getCovers() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function addCover(jpegDataUrl) {
  const g = getCovers();
  g.push(jpegDataUrl);
  while (g.length > MAX) g.shift();
  try { localStorage.setItem(KEY, JSON.stringify(g)); } catch { /* quota — keep in-memory only */ }
  return g;
}

export function clearCovers() {
  localStorage.removeItem(KEY);
}
