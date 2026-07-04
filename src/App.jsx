import { useState } from 'react';
import Capture from './components/Capture.jsx';
import StickerStudio from './components/StickerStudio.jsx';
import './App.css';

export default function App() {
  const [photo, setPhoto] = useState(null); // captured data URL -> studio

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="logo">
          NOT<span>BLUE</span>
        </h1>
        <p className="tagline">
          {photo ? 'sticker it up, then ship' : 'snap → sticker → ship'}
        </p>
      </header>

      <main className="frame">
        {photo ? (
          <StickerStudio photo={photo} onBack={() => setPhoto(null)} />
        ) : (
          <Capture onCapture={setPhoto} />
        )}
      </main>

      <footer className="foot">made not-blue · your photo never leaves this device</footer>
    </div>
  );
}
