import { useEffect, useState } from 'react';
import { sfx } from '../lib/sfx.js';

export default function BootScreen({ onDone }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 260);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="boot" onClick={() => sfx.boot()}>
      <div className="boot-scan" />
      <div className="boot-inner">
        <p className="boot-brand">NOT&nbsp;BLUE</p>
        <p className="boot-sub">▸ BLUE MACHINE ONLINE</p>
        <div className="boot-bar"><span style={{ width: pct + '%' }} /></div>
        <p className="boot-pct">{pct}%</p>
      </div>
    </div>
  );
}
