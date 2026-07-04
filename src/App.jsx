import { useState } from 'react';
import Capture from './components/Capture.jsx';
import StickerStudio from './components/StickerStudio.jsx';
import BootScreen from './components/BootScreen.jsx';
import { isMuted, setMuted, sfx } from './lib/sfx.js';
import './App.css';

export default function App() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem('nb.booted') === '1');
  const [photo, setPhoto] = useState(null);
  const [muted, setMutedState] = useState(isMuted());

  const finishBoot = () => { sessionStorage.setItem('nb.booted', '1'); setBooted(true); };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next); setMutedState(next);
    if (!next) sfx.pop();
  };

  if (!booted) return <BootScreen onDone={finishBoot} />;

  return (
    <div className="app">
      <header className="topbar">
        <button className="mute" onClick={toggleMute} aria-label="Toggle sound"
          title={muted ? 'Sound off' : 'Sound on'}>{muted ? '🔇' : '🔊'}</button>
        <h1 className="logo">NOT<span>BLUE</span></h1>
        <p className="tagline">{photo ? 'sticker it up, then ship' : 'snap → sticker → ship'}</p>
      </header>

      <main className="frame">
        {photo
          ? <StickerStudio photo={photo} onBack={() => setPhoto(null)} />
          : <Capture onCapture={setPhoto} />}
      </main>

      <footer className="foot">made not-blue · your photo never leaves this device</footer>
    </div>
  );
}
