// stickers.js — original sticker art as inline SVG -> data URLs.
//
// Everything here is drawn from scratch: an original round-eared mascot, hearts,
// stars, flowers, critters, Y2K bits, and text banners. No trademarked NewJeans
// bunny / wordmark / Powerpuff art (see IP note in the brief).

const wrap = (w, h, body) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`,
  );

// --- mascot: a chunky round-eared bun, our original NOT-BLUE character ---
const bun = (fill, ear, cheek) => `
  <g stroke="#0a1f4d" stroke-width="6" stroke-linejoin="round">
    <ellipse cx="42" cy="40" rx="14" ry="34" fill="${fill}"/>
    <ellipse cx="86" cy="40" rx="14" ry="34" fill="${fill}"/>
    <ellipse cx="42" cy="40" rx="6" ry="20" fill="${ear}" stroke="none"/>
    <ellipse cx="86" cy="40" rx="6" ry="20" fill="${ear}" stroke="none"/>
    <circle cx="64" cy="86" r="42" fill="${fill}"/>
    <circle cx="49" cy="82" r="5.5" fill="#0a1f4d" stroke="none"/>
    <circle cx="79" cy="82" r="5.5" fill="#0a1f4d" stroke="none"/>
    <circle cx="47" cy="80" r="1.8" fill="#fff" stroke="none"/>
    <circle cx="77" cy="80" r="1.8" fill="#fff" stroke="none"/>
    <circle cx="41" cy="94" r="6" fill="${cheek}" stroke="none" opacity="0.75"/>
    <circle cx="87" cy="94" r="6" fill="${cheek}" stroke="none" opacity="0.75"/>
    <path d="M58 92 q6 6 12 0" fill="none" stroke-width="4" stroke-linecap="round"/>
  </g>`;

const heartPuff = (fill) => `
  <path d="M64 108 C24 78 14 54 30 36 C42 22 60 26 64 42 C68 26 86 22 98 36 C114 54 104 78 64 108 Z"
    fill="${fill}" stroke="#0a1f4d" stroke-width="6" stroke-linejoin="round"/>
  <ellipse cx="46" cy="50" rx="8" ry="12" fill="#ffffff" opacity="0.55"/>`;

const heartPixel = (fill) => {
  const c = fill;
  const px = [
    [1, 0], [2, 0], [5, 0], [6, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
    [2, 4], [3, 4], [4, 4], [5, 4],
    [3, 5], [4, 5],
  ];
  const s = 16;
  return px
    .map(([x, y]) => `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}" fill="${c}"/>`)
    .join('');
};

const star = (fill) => `
  <path d="M64 12 L78 48 L118 50 L86 74 L98 112 L64 90 L30 112 L42 74 L10 50 L50 48 Z"
    fill="${fill}" stroke="#0a1f4d" stroke-width="6" stroke-linejoin="round"/>`;

const sparkle = (fill) => `
  <path d="M64 8 C68 44 84 60 120 64 C84 68 68 84 64 120 C60 84 44 68 8 64 C44 60 60 44 64 8 Z"
    fill="${fill}" stroke="#0a1f4d" stroke-width="5" stroke-linejoin="round"/>`;

const daisy = (petal, center) => {
  let g = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cx = 64 + Math.cos(a) * 30;
    const cy = 64 + Math.sin(a) * 30;
    g += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="12" ry="20" fill="${petal}" stroke="#0a1f4d" stroke-width="4" transform="rotate(${(a * 180) / Math.PI + 90} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  }
  return g + `<circle cx="64" cy="64" r="18" fill="${center}" stroke="#0a1f4d" stroke-width="4"/>`;
};

const cherry = () => `
  <path d="M40 30 Q70 20 92 40" fill="none" stroke="#2c6e49" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 30 Q34 60 40 82" fill="none" stroke="#2c6e49" stroke-width="6" stroke-linecap="round"/>
  <path d="M92 40 Q94 70 84 88" fill="none" stroke="#2c6e49" stroke-width="6" stroke-linecap="round"/>
  <circle cx="40" cy="94" r="20" fill="#ff5d73" stroke="#0a1f4d" stroke-width="5"/>
  <circle cx="84" cy="98" r="20" fill="#ff5d73" stroke="#0a1f4d" stroke-width="5"/>
  <ellipse cx="34" cy="88" rx="5" ry="7" fill="#fff" opacity="0.6"/>
  <ellipse cx="78" cy="92" rx="5" ry="7" fill="#fff" opacity="0.6"/>`;

const butterfly = (wing) => `
  <g stroke="#0a1f4d" stroke-width="5" stroke-linejoin="round">
    <path d="M62 64 C34 34 12 40 20 62 C12 84 40 92 62 66 Z" fill="${wing}"/>
    <path d="M66 64 C94 34 116 40 108 62 C116 84 88 92 66 66 Z" fill="${wing}"/>
    <ellipse cx="64" cy="64" rx="5" ry="24" fill="#0a1f4d" stroke="none"/>
    <path d="M64 42 q-8 -14 -16 -18" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path d="M64 42 q8 -14 16 -18" fill="none" stroke-width="4" stroke-linecap="round"/>
  </g>`;

const bow = (fill) => `
  <g stroke="#0a1f4d" stroke-width="5" stroke-linejoin="round">
    <path d="M64 64 L20 40 Q12 64 20 88 Z" fill="${fill}"/>
    <path d="M64 64 L108 40 Q116 64 108 88 Z" fill="${fill}"/>
    <circle cx="64" cy="64" r="12" fill="${fill}"/>
  </g>`;

// text banner ribbon
const banner = (text, fill = '#0a1f4d', ink = '#eaf1ff') => {
  const w = Math.max(180, 30 + text.length * 20);
  return wrap(
    w,
    72,
    `<path d="M8 18 L${w - 8} 18 L${w - 22} 36 L${w - 8} 54 L8 54 L22 36 Z"
       fill="${fill}" stroke="#eaf1ff" stroke-width="3"/>
     <text x="${w / 2}" y="43" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
       font-weight="900" font-size="24" fill="${ink}" letter-spacing="1">${text}</text>`,
  );
};

// A round "member circle" placeholder frame (drop your mini-selfie later)
const photoCircle = () => wrap(
  128, 128,
  `<circle cx="64" cy="64" r="58" fill="#dbe7ff" stroke="#0a1f4d" stroke-width="6"/>
   <circle cx="64" cy="52" r="18" fill="#9db8ef"/>
   <path d="M30 104 Q64 74 98 104" fill="#9db8ef"/>
   <circle cx="64" cy="64" r="58" fill="none" stroke="#eaf1ff" stroke-width="2"/>`,
);

export const STICKERS = [
  { id: 'bun-blue', label: 'Bun', url: wrap(128, 128, bun('#bcd2ff', '#eaf1ff', '#ff9ecb')) },
  { id: 'bun-pink', label: 'Bun', url: wrap(128, 128, bun('#ffd7ea', '#fff', '#ff7fb6')) },
  { id: 'bun-mint', label: 'Bun', url: wrap(128, 128, bun('#cdeede', '#f2fff8', '#ff9ecb')) },
  { id: 'heart-puff-blue', label: 'Heart', url: wrap(128, 128, heartPuff('#7aa7ff')) },
  { id: 'heart-puff-pink', label: 'Heart', url: wrap(128, 128, heartPuff('#ff7fb6')) },
  { id: 'heart-pixel', label: 'Pixel heart', url: wrap(128, 96, heartPixel('#3a6cff')) },
  { id: 'star', label: 'Star', url: wrap(128, 128, star('#ffe27a')) },
  { id: 'star-blue', label: 'Star', url: wrap(128, 128, star('#8fb4ff')) },
  { id: 'sparkle', label: 'Sparkle', url: wrap(128, 128, sparkle('#eaf1ff')) },
  { id: 'daisy', label: 'Daisy', url: wrap(128, 128, daisy('#ffffff', '#ffe27a')) },
  { id: 'daisy-blue', label: 'Daisy', url: wrap(128, 128, daisy('#bcd2ff', '#eaf1ff')) },
  { id: 'cherry', label: 'Cherry', url: wrap(128, 128, cherry()) },
  { id: 'butterfly', label: 'Butterfly', url: wrap(128, 128, butterfly('#9db8ef')) },
  { id: 'bow', label: 'Bow', url: wrap(128, 128, bow('#ff9ecb')) },
  { id: 'photo-circle', label: 'Photo bubble', url: photoCircle() },
  { id: 'banner-notblue', label: 'NOT BLUE', url: banner('NOT BLUE') },
  { id: 'banner-dontbe', label: "DON'T BE BLUE", url: banner("DON'T BE BLUE", '#3a6cff') },
  { id: 'banner-coverstar', label: '♥ COVER STAR', url: banner('♥ COVER STAR', '#ff5d8f', '#fff') },
];

// stickers that read as chaotic confetti for the "Sticker Bomb" button
export const BOMB_POOL = STICKERS.filter((s) => !s.id.startsWith('banner') && s.id !== 'photo-circle');
