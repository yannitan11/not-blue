// blueFilter.js — the "Blue Machine"
//
// Two aesthetics from one photo (the aha in the brief):
//   PRINT  — grainy blue duotone + Bayer dither + grain + vignette (EP-cover look)
//   PIXEL  — chunky 8-bit blocks, posterized onto the palette (Powerpuff look)
//
// Colour is a separate axis (Color Drop): the same recipe in blue / pink / green
// / lilac, chosen via PALETTES.
//
// Usage:
//   const f = new BlueFilter(1080);
//   f.render(src, { mode:'print', palette:PALETTES.blue, params:PRESETS.epCover });

export const PALETTES = {
  blue: { name: 'Blue', shadow: [0.03, 0.11, 0.34], high: [0.86, 0.92, 1.0] },
  pink: { name: 'Pink', shadow: [0.32, 0.05, 0.2], high: [1.0, 0.85, 0.93] },
  green: { name: 'Green', shadow: [0.02, 0.23, 0.16], high: [0.85, 1.0, 0.9] },
  lilac: { name: 'Lilac', shadow: [0.17, 0.08, 0.36], high: [0.91, 0.86, 1.0] },
};

export const PRESETS = {
  epCover: { name: 'EP Cover', levels: 4, dotScale: 2.2, grain: 0.14, vignette: 0.55, contrast: 1.18 },
  risograph: { name: 'Risograph', levels: 3, dotScale: 3.0, grain: 0.22, vignette: 0.35, contrast: 1.28 },
  faded: { name: 'Faded', levels: 6, dotScale: 1.6, grain: 0.09, vignette: 0.7, contrast: 1.05 },
  chrome: { name: 'Chrome', levels: 8, dotScale: 1.3, grain: 0.06, vignette: 0.5, contrast: 1.35 },
};

// pixel-mode defaults
const PIXEL = { blocks: 78, levels: 5, contrast: 1.2 };

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uRes;
uniform float uIntensity;
uniform float uSeed;
uniform float uGrain;
uniform float uDotScale;
uniform float uLevels;
uniform float uContrast;
uniform float uVignette;
uniform float uMode;      // 0 print, 1 pixel
uniform float uBlocks;    // pixel mode block count
uniform vec3  uShadow;
uniform vec3  uHigh;

float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  if (uMode > 0.5) {
    // ---- PIXEL ----
    vec2 uvp = (floor(vUv * uBlocks) + 0.5) / uBlocks;
    vec3 c = texture2D(uTex, uvp).rgb;
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    l = clamp((l - 0.5) * uContrast + 0.5, 0.0, 1.0);
    float q = clamp(floor(l * uLevels) / (uLevels - 1.0), 0.0, 1.0);
    vec3 duo = mix(uShadow, uHigh, q);
    gl_FragColor = vec4(clamp(mix(c, duo, uIntensity), 0.0, 1.0), 1.0);
    return;
  }

  // ---- PRINT ----
  vec3 src = texture2D(uTex, vUv).rgb;
  float lum = dot(src, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float d = bayer8(gl_FragCoord.xy / uDotScale);
  float q = clamp(floor(lum * uLevels + d) / uLevels, 0.0, 1.0);
  vec3 duo = mix(uShadow, uHigh, q);
  float g = hash(vUv * uRes + uSeed) - 0.5;
  duo += g * uGrain;
  float dist = distance(vUv, vec2(0.5));
  float vig = smoothstep(0.82, 0.32, dist);
  duo *= mix(1.0, vig, uVignette);
  gl_FragColor = vec4(clamp(mix(src, duo, uIntensity), 0.0, 1.0), 1.0);
}`;

function compile(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile failed: ' + log);
  }
  return sh;
}

export class BlueFilter {
  constructor(size = 1080) {
    this.size = size;

    this.crop = document.createElement('canvas');
    this.crop.width = this.crop.height = size;
    this.cropCtx = this.crop.getContext('2d');

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;

    const gl =
      this.canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
      this.canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Program link failed: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);
    this.prog = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.u = {};
    for (const n of [
      'uTex', 'uRes', 'uIntensity', 'uSeed', 'uGrain', 'uDotScale',
      'uLevels', 'uContrast', 'uVignette', 'uMode', 'uBlocks', 'uShadow', 'uHigh',
    ]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
  }

  render(source, {
    mirror = false,
    intensity = 0.9,
    params = PRESETS.epCover,
    palette = PALETTES.blue,
    mode = 'print',
    seed,
  } = {}) {
    const s = this.size;
    const ctx = this.cropCtx;

    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return false;
    const side = Math.min(sw, sh);
    const sx = (sw - side) / 2;
    const sy = (sh - side) / 2;

    ctx.save();
    ctx.clearRect(0, 0, s, s);
    if (mirror) { ctx.translate(s, 0); ctx.scale(-1, 1); }
    ctx.drawImage(source, sx, sy, side, side, 0, 0, s, s);
    ctx.restore();

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.crop);

    const isPixel = mode === 'pixel';
    gl.viewport(0, 0, s, s);
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform2f(this.u.uRes, s, s);
    gl.uniform1f(this.u.uIntensity, intensity);
    gl.uniform1f(this.u.uSeed, seed ?? Math.random() * 1000);
    gl.uniform1f(this.u.uGrain, params.grain);
    gl.uniform1f(this.u.uDotScale, params.dotScale);
    gl.uniform1f(this.u.uLevels, isPixel ? PIXEL.levels : params.levels);
    gl.uniform1f(this.u.uContrast, isPixel ? PIXEL.contrast : params.contrast);
    gl.uniform1f(this.u.uVignette, params.vignette);
    gl.uniform1f(this.u.uMode, isPixel ? 1 : 0);
    gl.uniform1f(this.u.uBlocks, PIXEL.blocks);
    gl.uniform3fv(this.u.uShadow, palette.shadow);
    gl.uniform3fv(this.u.uHigh, palette.high);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  }

  toDataURL(type = 'image/jpeg', quality = 0.95) {
    return this.canvas.toDataURL(type, quality);
  }

  dispose() {
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
}
