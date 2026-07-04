// blueFilter.js — the "Blue Machine" (PRINT mode)
//
// A tiny reusable WebGL pipeline that turns any source (video frame, image, or
// canvas) into a grainy blue *printed* album-cover look:
//   desaturate -> blue duotone map -> ordered (Bayer) dither -> grain -> vignette
//
// Usage:
//   const f = new BlueFilter(1080);
//   f.render(videoEl, { mirror: true, params: PRESETS.epCover, intensity: 0.9 });
//   document.body.appendChild(f.canvas);        // live preview
//   const dataUrl = f.toDataURL();              // freeze a capture
//
// Kept deliberately dependency-free so it can be lifted into any project later.

export const PRESETS = {
  epCover: {
    name: 'EP Cover',
    shadow: [0.03, 0.11, 0.34], // deep navy
    high: [0.86, 0.92, 1.0], // ice / paper white-blue
    levels: 4.0,
    dotScale: 2.2,
    grain: 0.14,
    vignette: 0.55,
    contrast: 1.18,
  },
  risograph: {
    name: 'Risograph',
    shadow: [0.06, 0.14, 0.46],
    high: [0.83, 0.9, 1.0],
    levels: 3.0,
    dotScale: 3.0,
    grain: 0.22,
    vignette: 0.35,
    contrast: 1.28,
  },
  faded: {
    name: 'Faded',
    shadow: [0.16, 0.24, 0.42],
    high: [0.9, 0.94, 1.0],
    levels: 6.0,
    dotScale: 1.6,
    grain: 0.09,
    vignette: 0.7,
    contrast: 1.05,
  },
  chrome: {
    name: 'Chrome',
    shadow: [0.02, 0.06, 0.2],
    high: [0.78, 0.9, 1.0],
    levels: 8.0,
    dotScale: 1.3,
    grain: 0.06,
    vignette: 0.5,
    contrast: 1.35,
  },
};

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
uniform vec3  uShadow;
uniform vec3  uHigh;

// Recursive Bayer ordered-dither (returns ~[0,1))
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 src = texture2D(uTex, vUv).rgb;

  // 1. desaturate
  float lum = dot(src, vec3(0.299, 0.587, 0.114));
  // 2. contrast / soft S-curve so print reads punchy
  lum = clamp((lum - 0.5) * uContrast + 0.5, 0.0, 1.0);

  // 3. ordered dither -> quantize into a few tones (the "printed" crunch)
  float d = bayer8(gl_FragCoord.xy / uDotScale);
  float q = clamp(floor(lum * uLevels + d) / uLevels, 0.0, 1.0);

  // 4. map tones onto the blue duotone ramp
  vec3 duo = mix(uShadow, uHigh, q);

  // 5. film / newsprint grain
  float g = hash(vUv * uRes + uSeed) - 0.5;
  duo += g * uGrain;

  // 6. vignette
  float dist = distance(vUv, vec2(0.5));
  float vig = smoothstep(0.82, 0.32, dist);
  duo *= mix(1.0, vig, uVignette);

  // intensity crossfades raw -> fully cooked
  vec3 outc = mix(src, duo, uIntensity);
  gl_FragColor = vec4(clamp(outc, 0.0, 1.0), 1.0);
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

    // square center-crop scratch canvas (2D) -> becomes the GL texture source
    this.crop = document.createElement('canvas');
    this.crop.width = this.crop.height = size;
    this.cropCtx = this.crop.getContext('2d');

    // the visible / exportable GL canvas
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

    // fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // texture
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.u = {};
    for (const n of [
      'uTex', 'uRes', 'uIntensity', 'uSeed', 'uGrain',
      'uDotScale', 'uLevels', 'uContrast', 'uVignette', 'uShadow', 'uHigh',
    ]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
  }

  // Draw `source` center-cropped to a square, upload it, run the shader.
  render(source, { mirror = false, intensity = 0.9, params = PRESETS.epCover, seed } = {}) {
    const s = this.size;
    const ctx = this.cropCtx;

    // work out the largest centered square of the source
    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return false;
    const side = Math.min(sw, sh);
    const sx = (sw - side) / 2;
    const sy = (sh - side) / 2;

    ctx.save();
    ctx.clearRect(0, 0, s, s);
    if (mirror) {
      ctx.translate(s, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, sx, sy, side, side, 0, 0, s, s);
    ctx.restore();

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.crop);

    gl.viewport(0, 0, s, s);
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform2f(this.u.uRes, s, s);
    gl.uniform1f(this.u.uIntensity, intensity);
    gl.uniform1f(this.u.uSeed, seed ?? Math.random() * 1000);
    gl.uniform1f(this.u.uGrain, params.grain);
    gl.uniform1f(this.u.uDotScale, params.dotScale);
    gl.uniform1f(this.u.uLevels, params.levels);
    gl.uniform1f(this.u.uContrast, params.contrast);
    gl.uniform1f(this.u.uVignette, params.vignette);
    gl.uniform3fv(this.u.uShadow, params.shadow);
    gl.uniform3fv(this.u.uHigh, params.high);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  }

  toDataURL(type = 'image/jpeg', quality = 0.95) {
    return this.canvas.toDataURL(type, quality);
  }

  dispose() {
    const gl = this.gl;
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
}
