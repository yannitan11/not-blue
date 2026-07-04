// bunny.js — an original, parametric chibi "puff-style" mascot.
// buildBunny(opts) -> transparent SVG data URL, drop straight onto the cover.

export const OPTIONS = {
  body: [
    { id: 'ice', c: '#bcd2ff', ear: '#eaf1ff' },
    { id: 'pink', c: '#ffd7ea', ear: '#fff0f6' },
    { id: 'mint', c: '#cdeede', ear: '#f2fff8' },
    { id: 'butter', c: '#ffe9a8', ear: '#fff6d6' },
    { id: 'lilac', c: '#d9caff', ear: '#efe8ff' },
    { id: 'cocoa', c: '#c9a98a', ear: '#e6d3bf' },
  ],
  eyes: ['#0a1f4d', '#3a6cff', '#7a4a2a', '#2c6e49'],
  cheek: ['#ff9ecb', '#ff7fb6', '#ffb37a'],
  accessory: ['none', 'headphones', 'bow', 'glasses', 'antennae', 'crown'],
  aura: ['none', '#7aa7ff', '#ff7fb6', '#8ef0c8', '#ffe27a', '#c9a9ff'],
  pose: ['peace', 'wave', 'cross'],
};

const OUT = '#0a1f4d';

function accessorySVG(kind) {
  switch (kind) {
    case 'headphones':
      return `<g stroke="${OUT}" stroke-width="7" fill="#3a6cff" stroke-linejoin="round">
        <path d="M60 96 Q128 34 196 96" fill="none"/>
        <rect x="44" y="92" width="30" height="46" rx="12"/>
        <rect x="182" y="92" width="30" height="46" rx="12"/></g>`;
    case 'bow':
      return `<g stroke="${OUT}" stroke-width="6" fill="#ff7fb6" stroke-linejoin="round">
        <path d="M128 60 L92 40 Q84 62 92 84 Z"/><path d="M128 60 L164 40 Q172 62 164 84 Z"/>
        <circle cx="128" cy="62" r="12"/></g>`;
    case 'glasses':
      return `<g stroke="${OUT}" stroke-width="6" fill="rgba(122,167,255,0.35)">
        <rect x="78" y="150" width="46" height="38" rx="12"/>
        <rect x="132" y="150" width="46" height="38" rx="12"/>
        <path d="M124 168 h8" fill="none"/></g>`;
    case 'antennae':
      return `<g stroke="${OUT}" stroke-width="6" fill="#ffe27a" stroke-linecap="round">
        <path d="M104 70 Q96 40 84 30" fill="none"/><circle cx="82" cy="26" r="9"/>
        <path d="M152 70 Q160 40 172 30" fill="none"/><circle cx="174" cy="26" r="9"/></g>`;
    case 'crown':
      return `<path d="M92 78 L104 50 L128 72 L152 50 L164 78 Z" fill="#ffe27a"
        stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`;
    default:
      return '';
  }
}

function poseArms(kind, body) {
  if (kind === 'wave')
    return `<g stroke="${OUT}" stroke-width="6" fill="${body}" stroke-linejoin="round">
      <ellipse cx="70" cy="248" rx="20" ry="26" transform="rotate(-30 70 248)"/>
      <ellipse cx="188" cy="300" rx="20" ry="26"/></g>`;
  if (kind === 'cross')
    return `<g stroke="${OUT}" stroke-width="6" fill="${body}" stroke-linejoin="round">
      <ellipse cx="92" cy="292" rx="30" ry="18" transform="rotate(18 92 292)"/>
      <ellipse cx="164" cy="292" rx="30" ry="18" transform="rotate(-18 164 292)"/></g>`;
  // peace
  return `<g stroke="${OUT}" stroke-width="6" fill="${body}" stroke-linejoin="round">
    <ellipse cx="64" cy="300" rx="20" ry="26"/>
    <ellipse cx="192" cy="252" rx="18" ry="24" transform="rotate(24 192 252)"/></g>`;
}

export function buildBunny(o) {
  const body = OPTIONS.body.find((b) => b.id === o.body) || OPTIONS.body[0];
  const eye = o.eyes || OPTIONS.eyes[0];
  const cheek = o.cheek || OPTIONS.cheek[0];
  const aura = o.aura && o.aura !== 'none'
    ? `<ellipse cx="128" cy="196" rx="150" ry="168" fill="${o.aura}" opacity="0.28"/>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 360" width="256" height="360">
    ${aura}
    <!-- ears -->
    <g stroke="${OUT}" stroke-width="7" stroke-linejoin="round">
      <ellipse cx="98" cy="96" rx="22" ry="60" fill="${body.c}"/>
      <ellipse cx="158" cy="96" rx="22" ry="60" fill="${body.c}"/>
      <ellipse cx="98" cy="96" rx="10" ry="38" fill="${body.ear}" stroke="none"/>
      <ellipse cx="158" cy="96" rx="10" ry="38" fill="${body.ear}" stroke="none"/>
    </g>
    ${poseArms(o.pose || 'peace', body.c)}
    <!-- body -->
    <ellipse cx="128" cy="292" rx="66" ry="60" fill="${body.c}" stroke="${OUT}" stroke-width="7"/>
    <!-- head -->
    <circle cx="128" cy="178" r="86" fill="${body.c}" stroke="${OUT}" stroke-width="7"/>
    <!-- cheeks -->
    <circle cx="86" cy="196" r="13" fill="${cheek}" opacity="0.8"/>
    <circle cx="170" cy="196" r="13" fill="${cheek}" opacity="0.8"/>
    <!-- eyes -->
    <circle cx="102" cy="172" r="11" fill="${eye}"/>
    <circle cx="154" cy="172" r="11" fill="${eye}"/>
    <circle cx="98" cy="168" r="3.5" fill="#fff"/>
    <circle cx="150" cy="168" r="3.5" fill="#fff"/>
    <!-- nose + mouth -->
    <path d="M124 190 q4 5 8 0" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    <path d="M112 200 q16 14 32 0" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    ${accessorySVG(o.accessory || 'none')}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function randomBunny(lock = {}) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    body: lock.body ?? pick(OPTIONS.body).id,
    eyes: lock.eyes ?? pick(OPTIONS.eyes),
    cheek: lock.cheek ?? pick(OPTIONS.cheek),
    accessory: lock.accessory ?? pick(OPTIONS.accessory),
    aura: lock.aura ?? pick(OPTIONS.aura),
    pose: lock.pose ?? pick(OPTIONS.pose),
  };
}
