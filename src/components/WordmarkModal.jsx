import { useState } from 'react';
import { WORDMARK_STYLES, makeWordmark } from '../lib/wordmark.js';
import { sfx } from '../lib/sfx.js';

export default function WordmarkModal({ onAdd, onClose }) {
  const [text, setText] = useState('NOT BLUE');
  const [style, setStyle] = useState('chrome');
  const preview = makeWordmark(text, style);

  return (
    <div className="cc-backdrop" onMouseDown={onClose}>
      <div className="cc-modal wm" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cc-head">
          <h2>Wordmark</h2>
          <button className="cc-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <input
          className="wm-input"
          value={text}
          maxLength={18}
          placeholder="your name / group…"
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />

        <div className="cc-chips wm-styles">
          {WORDMARK_STYLES.map((s) => (
            <button key={s.id}
              className={'chip' + (style === s.id ? ' active' : '')}
              onClick={() => { setStyle(s.id); sfx.pop(); }}>{s.label}</button>
          ))}
        </div>

        <div className="wm-preview">
          <img src={preview.url} alt="wordmark preview" />
        </div>

        <div className="cc-actions">
          <button className="btn ship" onClick={() => { onAdd(preview.url); sfx.peel(); }}>
            Add to cover
          </button>
        </div>
      </div>
    </div>
  );
}
