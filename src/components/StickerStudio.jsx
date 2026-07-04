import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Image as KImage, Transformer } from 'react-konva';
import { STICKERS, BOMB_POOL } from '../lib/stickers.js';
import { composeStory, composeEPGrid, download } from '../lib/exporters.js';
import { addCover } from '../lib/gallery.js';
import { sfx } from '../lib/sfx.js';
import WordmarkModal from './WordmarkModal.jsx';
import CharacterCreator from './CharacterCreator.jsx';

let _id = 0;
const uid = () => `s${_id++}`;

function useImage(url) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    const i = new window.Image();
    i.onload = () => setImg(i);
    i.src = url;
    return () => { i.onload = null; };
  }, [url]);
  return img;
}

function StickerNode({ item, isSelected, onSelect, onChange, register }) {
  const img = useImage(item.url);
  const ref = useRef(null);
  useEffect(() => { register(item.id, ref.current); }, [item.id, register, img]);
  if (!img) return null;
  return (
    <KImage
      ref={ref}
      image={img}
      x={item.x} y={item.y}
      width={item.w} height={item.h}
      offsetX={item.w / 2} offsetY={item.h / 2}
      rotation={item.rotation}
      scaleX={item.scaleX} scaleY={item.scaleY}
      draggable
      onClick={onSelect} onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const n = e.target;
        onChange({ x: n.x(), y: n.y(), rotation: n.rotation(), scaleX: n.scaleX(), scaleY: n.scaleY() });
      }}
      shadowColor={isSelected ? '#3a6cff' : undefined}
    />
  );
}

export default function StickerStudio({ photo, onBack }) {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const nodes = useRef({});
  const bg = useImage(photo);

  const [size, setSize] = useState(480);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState('none'); // none | wordmark | bunny
  const [busy, setBusy] = useState('');

  const register = useCallback((id, node) => {
    if (node) nodes.current[id] = node; else delete nodes.current[id];
  }, []);

  useEffect(() => {
    const fit = () => {
      const el = wrapRef.current;
      if (!el) return;
      const next = Math.max(260, Math.min(el.clientWidth, 560));
      setSize((prev) => {
        if (prev && next !== prev) {
          const r = next / prev;
          setItems((list) => list.map((it) => ({ ...it, x: it.x * r, y: it.y * r, w: it.w * r, h: it.h * r })));
        }
        return next;
      });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selected && nodes.current[selected];
    tr.nodes(node ? [node] : []);
    tr.getLayer() && tr.getLayer().batchDraw();
  }, [selected, items]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); removeSelected(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const addItem = useCallback((url, x, y, frac = 0.24, rot = null) => {
    const i = new window.Image();
    i.onload = () => {
      const base = size * frac;
      const ar = i.naturalWidth / i.naturalHeight;
      const w = ar >= 1 ? base : base * ar;
      const h = ar >= 1 ? base / ar : base;
      const id = uid();
      setItems((prev) => [...prev, {
        id, url, x, y, w, h,
        rotation: rot == null ? Math.random() * 24 - 12 : rot, scaleX: 1, scaleY: 1,
      }]);
      setSelected(id);
      sfx.peel();
    };
    i.src = url;
  }, [size]);

  const addFromPalette = (s) => {
    const frac = s.id.startsWith('banner') ? 0.6 : s.id === 'photo-circle' ? 0.34 : 0.24;
    const jitter = () => size / 2 + (Math.random() * 80 - 40);
    addItem(s.url, jitter(), jitter(), frac);
  };

  const stickerBomb = () => {
    for (let n = 0; n < 9; n++) {
      const s = BOMB_POOL[Math.floor(Math.random() * BOMB_POOL.length)];
      const x = size * (0.12 + Math.random() * 0.76);
      const y = size * (0.12 + Math.random() * 0.76);
      addItem(s.url, x, y, 0.12 + Math.random() * 0.16, Math.random() * 60 - 30);
    }
    setSelected(null);
  };

  const updateItem = (id, attrs) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...attrs } : it)));

  const removeSelected = () => {
    if (!selected) return;
    setItems((prev) => prev.filter((it) => it.id !== selected));
    delete nodes.current[selected];
    setSelected(null);
  };

  const bringForward = () => setItems((prev) => {
    const i = prev.findIndex((it) => it.id === selected);
    if (i < 0 || i === prev.length - 1) return prev;
    const next = [...prev]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; return next;
  });
  const sendBackward = () => setItems((prev) => {
    const i = prev.findIndex((it) => it.id === selected);
    if (i <= 0) return prev;
    const next = [...prev]; [next[i], next[i - 1]] = [next[i - 1], next[i]]; return next;
  });

  // Export the clean square. Detach the transformer synchronously so the resize
  // handles aren't baked in — Konva's toDataURL redraws the layers, so there's no
  // need to wait a frame (rAF is paused when the tab is hidden, which would hang).
  const renderSquare = (mime = 'image/png', q = 0.95) => {
    if (trRef.current) trRef.current.nodes([]);
    setSelected(null);
    return stageRef.current.toDataURL({ pixelRatio: 1080 / size, mimeType: mime, quality: q });
  };

  const shipSquare = async () => {
    setBusy('square');
    const png = await renderSquare('image/png');
    download(png, `not-blue-${Date.now()}.png`);
    addCover(await renderSquare('image/jpeg', 0.82));
    sfx.chime(); setBusy('');
  };
  const shipStory = async () => {
    setBusy('story');
    const png = await renderSquare('image/png');
    download(await composeStory(png), `not-blue-story-${Date.now()}.png`);
    sfx.chime(); setBusy('');
  };
  const shipEP = async () => {
    setBusy('ep');
    const covers = addCover(await renderSquare('image/jpeg', 0.82));
    download(await composeEPGrid(covers), `not-blue-EP-${Date.now()}.png`);
    sfx.chime(); setBusy('');
  };

  const onStageMouseDown = (e) => {
    if (e.target === e.target.getStage() || e.target.attrs?.name === 'bg') setSelected(null);
  };

  return (
    <div className="studio">
      <div className="studio-canvas" ref={wrapRef}>
        <Stage
          ref={stageRef}
          width={size} height={size}
          onMouseDown={onStageMouseDown} onTouchStart={onStageMouseDown}
          className="stage-frame"
        >
          <Layer>
            {bg && <KImage image={bg} width={size} height={size} name="bg" listening />}
          </Layer>
          <Layer>
            {items.map((it) => (
              <StickerNode
                key={it.id} item={it}
                isSelected={selected === it.id}
                onSelect={() => setSelected(it.id)}
                onChange={(attrs) => updateItem(it.id, attrs)}
                register={register}
              />
            ))}
            <Transformer
              ref={trRef}
              rotateEnabled keepRatio anchorSize={12}
              borderStroke="#3a6cff" anchorStroke="#3a6cff" anchorFill="#eaf1ff"
              boundBoxFunc={(oldB, newB) => (newB.width < 24 ? oldB : newB)}
            />
          </Layer>
        </Stage>
      </div>

      <div className="studio-tools">
        <div className="tool-row">
          <button className="btn ghost small" onClick={onBack}>← Retake</button>
          <button className="btn small" onClick={stickerBomb}>💥 Bomb</button>
          <button className="btn small" onClick={() => setModal('wordmark')}>Aa Word</button>
          <button className="btn small" onClick={() => setModal('bunny')}>🐰 Bunny</button>
          <button className="btn ghost small" onClick={bringForward} disabled={!selected}>Front</button>
          <button className="btn ghost small" onClick={sendBackward} disabled={!selected}>Back</button>
          <button className="btn ghost small danger" onClick={removeSelected} disabled={!selected}>Delete</button>
        </div>

        <div className="export-row">
          <span className="export-label">⤓ Ship</span>
          <button className="btn ship" disabled={!!busy} onClick={shipSquare}>
            {busy === 'square' ? '…' : 'Square'}
          </button>
          <button className="btn ship alt" disabled={!!busy} onClick={shipStory}>
            {busy === 'story' ? '…' : 'Story'}
          </button>
          <button className="btn ship alt" disabled={!!busy} onClick={shipEP}>
            {busy === 'ep' ? '…' : 'EP grid'}
          </button>
        </div>

        <div className="sticker-tray">
          {STICKERS.map((s) => (
            <button key={s.id} className="tray-item" title={s.label} onClick={() => addFromPalette(s)}>
              <img src={s.url} alt={s.label} />
            </button>
          ))}
        </div>
      </div>

      {modal === 'wordmark' && (
        <WordmarkModal
          onClose={() => setModal('none')}
          onAdd={(url) => { addItem(url, size / 2, size * 0.35, 0.66); setModal('none'); }}
        />
      )}
      {modal === 'bunny' && (
        <CharacterCreator
          onClose={() => setModal('none')}
          onAdd={(url) => { addItem(url, size / 2, size / 2, 0.5); setModal('none'); }}
        />
      )}
    </div>
  );
}
