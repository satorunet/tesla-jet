// Canvas textures the car model needs (licence plate, contact shadow), trimmed from the main tesra game's tex.js.
import * as THREE from 'three';

const JP = '"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif';
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
export function blobTex() {
  const [c, x] = cnv(128, 256);
  const g = x.createRadialGradient(64, 128, 10, 64, 128, 64);
  g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.scale(1, 2); x.fillStyle = g; x.fillRect(0, 0, 128, 128); x.restore();
  return tex(c, { repeat: false, srgb: false });
}
export function plateTex() {
  const [c, x] = cnv(256, 128);
  x.fillStyle = '#f5f5f0'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#1d5a3a'; x.lineWidth = 6; x.strokeRect(5, 5, 246, 118);
  x.fillStyle = '#1d5a3a'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `700 30px ${JP}`; x.fillText('品川 300', 128, 34);
  x.font = `700 26px ${JP}`; x.fillText('て', 34, 86);
  x.font = `700 62px "Noto Sans JP"`; x.fillText('8・88', 146, 84);
  return tex(c, { repeat: false });
}
