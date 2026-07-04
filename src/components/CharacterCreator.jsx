import { useState } from 'react';
import { OPTIONS, buildBunny, randomBunny } from '../lib/bunny.js';
import { sfx } from '../lib/sfx.js';

const BIAS_KEY = 'nb.bias';

function loadBias() {
  try { return JSON.parse(localStorage.getItem(BIAS_KEY)); } catch { return null; }
}

export default function CharacterCreator({ onAdd, onClose }) {
  const [opts, setOpts] = useState(() => loadBias() || randomBunny());
  const url = buildBunny(opts);
  const set = (k, v) => setOpts((o) => ({ ...o, [k]: v }));

  const Swatches = ({ label, k, list, getColor = (x) => x, getVal = (x) => x }) => (
    <div className="cc-row">
      <span className="cc-label">{label}</span>
      <div className="cc-swatches">
        {list.map((item) => {
          const v = getVal(item);
          const c = getColor(item);
          const active = opts[k] === v;
          return (
            <button
              key={v}
              className={'cc-swatch' + (active ? ' active' : '')}
              style={c === 'none'
                ? { background: 'transparent', color: 'var(--ice)', fontSize: 10 }
                : { background: c }}
              onClick={() => { set(k, v); sfx.pop(); }}
              title={String(v)}
            >
              {c === 'none' ? '∅' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="cc-backdrop" onMouseDown={onClose}>
      <div className="cc-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cc-head">
          <h2>Make a Bunny</h2>
          <button className="cc-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="cc-stage">
          <img src={url} alt="your bunny" />
        </div>

        <div className="cc-controls">
          <Swatches label="Body" k="body" list={OPTIONS.body}
            getColor={(b) => b.c} getVal={(b) => b.id} />
          <Swatches label="Eyes" k="eyes" list={OPTIONS.eyes} />
          <Swatches label="Cheeks" k="cheek" list={OPTIONS.cheek} />
          <Swatches label="Aura" k="aura" list={OPTIONS.aura} />

          <div className="cc-row">
            <span className="cc-label">Extra</span>
            <div className="cc-chips">
              {OPTIONS.accessory.map((a) => (
                <button key={a}
                  className={'chip' + (opts.accessory === a ? ' active' : '')}
                  onClick={() => { set('accessory', a); sfx.pop(); }}>{a}</button>
              ))}
            </div>
          </div>
          <div className="cc-row">
            <span className="cc-label">Pose</span>
            <div className="cc-chips">
              {OPTIONS.pose.map((p) => (
                <button key={p}
                  className={'chip' + (opts.pose === p ? ' active' : '')}
                  onClick={() => { set('pose', p); sfx.pop(); }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="cc-actions">
          <button className="btn ghost small" onClick={() => { setOpts(randomBunny()); sfx.pop(); }}>
            🎲 Randomize
          </button>
          <button className="btn ghost small" onClick={() => {
            localStorage.setItem(BIAS_KEY, JSON.stringify(opts));
            sfx.chime();
          }}>★ Save bias</button>
          <button className="btn ship" onClick={() => { onAdd(url); sfx.peel(); }}>
            Add to cover
          </button>
        </div>
      </div>
    </div>
  );
}
