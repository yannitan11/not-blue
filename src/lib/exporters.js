// exporters.js — compose the finished square cover into shareable formats.

function loadImg(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
}

function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
}

// 9:16 story with the cover framed on a blue wash
export async function composeStory(coverUrl, { caption = 'COVER STAR' } = {}) {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#16367f'); g.addColorStop(1, '#071230');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  const img = await loadImg(coverUrl);
  const s = 900, ox = (W - s) / 2, oy = 420;

  x.save();
  x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 44; x.shadowOffsetY = 22;
  roundRect(x, ox - 14, oy - 14, s + 28, s + 28, 30);
  x.fillStyle = '#0d2a66'; x.fill();
  x.restore();

  roundRect(x, ox, oy, s, s, 20);
  x.save(); x.clip();
  x.drawImage(img, ox, oy, s, s);
  x.restore();

  x.textAlign = 'center';
  x.fillStyle = '#eaf1ff';
  x.font = "900 130px 'Arial Black', Arial, sans-serif";
  x.fillText('NOT BLUE', W / 2, 280);
  x.fillStyle = 'rgba(234,241,255,0.75)';
  x.font = "700 44px Arial, sans-serif";
  x.fillText(caption.toUpperCase(), W / 2, oy + s + 120);

  return c.toDataURL('image/png');
}

// 2×3 contact sheet like the EP covers page
export async function composeEPGrid(urls) {
  const cols = 2, rows = 3, pad = 40, gap = 26, W = 1080, header = 150;
  const cell = (W - 2 * pad - (cols - 1) * gap) / cols;
  const H = Math.round(header + 2 * pad + rows * cell + (rows - 1) * gap);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0d2a66'); g.addColorStop(1, '#071230');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  x.textAlign = 'left';
  x.fillStyle = '#eaf1ff';
  x.font = "900 92px 'Arial Black', Arial, sans-serif";
  x.fillText('NOT BLUE', pad, header - 30);
  x.fillStyle = 'rgba(234,241,255,0.6)';
  x.font = "700 30px Arial, sans-serif";
  x.textAlign = 'right';
  x.fillText('— THE EP —', W - pad, header - 40);

  const imgs = await Promise.all(
    urls.slice(0, 6).map((u) => loadImg(u).catch(() => null)),
  );

  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = pad + col * (cell + gap);
    const cy = header + pad + row * (cell + gap);
    roundRect(x, cx, cy, cell, cell, 16);
    x.save(); x.clip();
    if (imgs[i]) {
      x.drawImage(imgs[i], cx, cy, cell, cell);
    } else {
      x.fillStyle = 'rgba(188,210,255,0.08)';
      x.fillRect(cx, cy, cell, cell);
      x.fillStyle = 'rgba(188,210,255,0.3)';
      x.textAlign = 'center';
      x.font = "800 40px Arial";
      x.fillText('+', cx + cell / 2, cy + cell / 2 + 14);
    }
    x.restore();
    roundRect(x, cx, cy, cell, cell, 16);
    x.strokeStyle = 'rgba(234,241,255,0.35)';
    x.lineWidth = 3; x.stroke();
  }

  return c.toDataURL('image/png');
}

export function download(dataUrl, name) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  a.click();
}
