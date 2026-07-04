import { useEffect, useRef, useState, useCallback } from 'react';
import { BlueFilter, PRESETS, PALETTES } from '../lib/blueFilter.js';
import { sfx } from '../lib/sfx.js';

const PRESET_KEYS = Object.keys(PRESETS);
const PALETTE_KEYS = Object.keys(PALETTES);

function makeDemoCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 720;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 720, 720);
  g.addColorStop(0, '#ffd6a5'); g.addColorStop(1, '#ff8fab');
  x.fillStyle = g; x.fillRect(0, 0, 720, 720);
  x.fillStyle = '#fff3b0';
  x.beginPath(); x.arc(540, 190, 90, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f4c9a0';
  x.beginPath(); x.ellipse(360, 400, 150, 175, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#3a2a20';
  x.beginPath(); x.arc(360, 300, 165, Math.PI, 0); x.fill();
  x.fillRect(195, 300, 40, 150); x.fillRect(485, 300, 40, 150);
  x.fillStyle = '#2a2320';
  x.beginPath(); x.arc(305, 390, 16, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(415, 390, 16, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#8a3b3b'; x.lineWidth = 12; x.lineCap = 'round';
  x.beginPath(); x.arc(360, 450, 55, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  return c;
}

export default function Capture({ onCapture }) {
  const holderRef = useRef(null);
  const videoRef = useRef(null);
  const filterRef = useRef(null);
  const sourceRef = useRef(null);
  const mirrorRef = useRef(false);
  const rafRef = useRef(0);

  const [preset, setPreset] = useState('epCover');
  const [intensity, setIntensity] = useState(0.9);
  const [mode, setMode] = useState('print');
  const [palette, setPalette] = useState('blue');
  const [status, setStatus] = useState('starting');
  const [note, setNote] = useState('');
  const [flash, setFlash] = useState(false);

  const settings = useRef({ preset, intensity, mode, palette });
  settings.current = { preset, intensity, mode, palette };

  const startCamera = useCallback(async () => {
    setStatus('starting'); setNote('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play();
      sourceRef.current = v; mirrorRef.current = true;
      setStatus('live');
    } catch (err) {
      setStatus('error');
      setNote(err && err.name === 'NotAllowedError'
        ? 'Camera blocked — upload a photo or try the demo.'
        : 'No camera here — upload a photo or try the demo.');
    }
  }, []);

  const useDemo = useCallback(() => {
    sourceRef.current = makeDemoCanvas(); mirrorRef.current = false;
    setStatus('live'); setNote(''); sfx.pop();
  }, []);

  const onFile = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => { sourceRef.current = img; mirrorRef.current = false; setStatus('live'); setNote(''); };
    img.src = URL.createObjectURL(file);
  }, []);

  useEffect(() => {
    let filter;
    try { filter = new BlueFilter(1080); }
    catch { setStatus('error'); setNote('WebGL is unavailable in this browser.'); return; }
    filterRef.current = filter;
    filter.canvas.className = 'filter-canvas';
    holderRef.current.appendChild(filter.canvas);

    const loop = () => {
      const src = sourceRef.current;
      if (src) {
        const { preset: p, intensity: i, mode: m, palette: pl } = settings.current;
        filter.render(src, {
          mirror: mirrorRef.current, intensity: i,
          params: PRESETS[p], palette: PALETTES[pl], mode: m,
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    startCamera();

    return () => {
      cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      if (v && v.srcObject) v.srcObject.getTracks().forEach((t) => t.stop());
      filter.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shoot = () => {
    const filter = filterRef.current;
    if (!filter || !sourceRef.current) return;
    sfx.shutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    const { intensity: i, preset: p, mode: m, palette: pl } = settings.current;
    filter.render(sourceRef.current, {
      mirror: mirrorRef.current, intensity: i,
      params: PRESETS[p], palette: PALETTES[pl], mode: m,
    });
    onCapture(filter.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="capture">
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div className="mode-toggle">
        <button className={mode === 'print' ? 'active' : ''}
          onClick={() => { setMode('print'); sfx.pop(); }}>PRINT</button>
        <button className={mode === 'pixel' ? 'active' : ''}
          onClick={() => { setMode('pixel'); sfx.pop(); }}>PIXEL</button>
      </div>

      <div className="stage-frame">
        <div className="filter-holder" ref={holderRef} />
        {flash && <div className="shutter-flash" />}
        {status !== 'live' && (
          <div className="stage-overlay">
            {status === 'starting' && <p>Waking the Blue Machine…</p>}
            {status === 'error' && (
              <>
                <p className="hint">{note}</p>
                <div className="overlay-actions">
                  <label className="btn">Upload photo
                    <input type="file" accept="image/*" onChange={onFile} hidden /></label>
                  <button className="btn ghost" onClick={useDemo}>Try the demo</button>
                  <button className="btn ghost" onClick={startCamera}>Retry camera</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Color Drop */}
      <div className="palette-row">
        <span className="drop-label">color drop</span>
        {PALETTE_KEYS.map((k) => (
          <button key={k}
            className={'pal-dot' + (palette === k ? ' active' : '')}
            style={{ background: `rgb(${PALETTES[k].shadow.map((n) => Math.round(n * 255 + 60)).join(',')})` }}
            title={PALETTES[k].name}
            onClick={() => { setPalette(k); sfx.pop(); }} />
        ))}
      </div>

      <div className="preset-row">
        {PRESET_KEYS.map((k) => (
          <button key={k}
            className={'chip' + (preset === k ? ' active' : '')}
            onClick={() => { setPreset(k); sfx.pop(); }}>{PRESETS[k].name}</button>
        ))}
      </div>

      <div className="slider-row">
        <span>barely</span>
        <input type="range" min="0" max="1" step="0.01" value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))} />
        <span>cooked</span>
      </div>

      <div className="capture-actions">
        <label className="btn ghost small">Upload
          <input type="file" accept="image/*" onChange={onFile} hidden /></label>
        <button className="shutter" onClick={shoot} disabled={status !== 'live'} aria-label="Take photo">
          <span />
        </button>
        <button className="btn ghost small" onClick={useDemo}>Demo</button>
      </div>
    </div>
  );
}
