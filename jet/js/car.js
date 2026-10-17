// Tesla roadster model, copied from the main tesra game (js/car.js buildRoadster) so this game doesn't pull in the town code.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './tex.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function RoundedMirror() {
  const g = new THREE.SphereGeometry(0.1, 12, 8); g.scale(0.9, 0.45, 0.55);
  return g;
}

export function buildRoadster(color = 0xf3f3ef) { // pearl white
  const car = new THREE.Group();
  const body = new THREE.Group(); car.add(body);

  const paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.12, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.4, sheenColor: 0xdfe6ff, envMapIntensity: 1.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x07090c, metalness: 0.4, roughness: 0.03, clearcoat: 1, envMapIntensity: 1.6 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.55, metalness: 0.2 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.18, metalness: 1 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.28, metalness: 0.95 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x131314, roughness: 0.92 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 2, roughness: 0.1 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1010, emissiveIntensity: 1.5, roughness: 0.2 });

  // --- body: side profile extruded across the width, then tapered
  const R_ARCH = 0.52, WR = 0.345, XF = 1.30, XR = -1.33;
  // angular wedge (SR-71 / F-35 inspired): low sharp nose, beltline rising straight to a high cut-off tail
  const s = new THREE.Shape();
  s.moveTo(-2.0, 0.32);
  s.lineTo(XR - R_ARCH - 0.02, 0.32);
  s.absarc(XR, WR, R_ARCH, Math.PI, 0, true);
  s.lineTo(XF - R_ARCH, 0.31);
  s.absarc(XF, WR, R_ARCH, Math.PI, 0, true);
  s.lineTo(2.02, 0.29);
  s.lineTo(2.22, 0.4);                 // sharp nose
  s.lineTo(2.08, 0.5);
  s.lineTo(1.4, 0.64);                 // flat hood
  s.lineTo(0.6, 0.78);
  s.lineTo(-1.0, 0.96);                // beltline rises towards the rear
  s.lineTo(-1.95, 1.04);               // high rear deck
  s.lineTo(-2.14, 1.02);
  s.lineTo(-2.16, 0.7);                // cut-off (kamm) tail
  s.lineTo(-2.08, 0.42);
  s.lineTo(-2.0, 0.32);
  const W0 = 1.74;
  let bg = new THREE.ExtrudeGeometry(s, { depth: W0, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 1, curveSegments: 20, steps: 2 });
  bg.deleteAttribute('uv'); bg.deleteAttribute('normal'); bg = bg.toNonIndexed();
  bg.translate(0, 0, -W0 / 2);
  {
    const p = bg.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k); let z = p.getZ(k);
      z *= 1 - 0.24 * smooth(1.1, 2.25, x);                   // nose narrows to a blade
      z *= 1 - 0.06 * smooth(-1.6, -2.2, x);
      z *= 1 - 0.1 * Math.max(0, y - 0.62) / 0.42;           // slab sides with a little tumblehome
      if (y > 0.45 && y < 1.0) z *= 1 + 0.04 * Math.exp(-Math.pow((x - XR) / 0.55, 2)); // rear haunches
      p.setZ(k, z);
    }
    bg.computeVertexNormals();                               // flat facets
  }
  bg.rotateY(-Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bg, paint); bodyMesh.castShadow = true; body.add(bodyMesh);

  // --- glasshouse
  // angular dark canopy that runs far forward onto the hood, squared-off roof
  const c = new THREE.Shape();
  c.moveTo(1.55, 0.62);
  c.lineTo(0.15, 1.12);                // long raked screen
  c.lineTo(-0.85, 1.19);               // squarer roof
  c.lineTo(-1.6, 1.04);
  c.lineTo(-1.6, 0.92);
  c.lineTo(1.55, 0.62);
  const CW0 = 1.28;
  let cg = new THREE.ExtrudeGeometry(c, { depth: CW0, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 1 });
  cg.deleteAttribute('uv'); cg.deleteAttribute('normal'); cg = cg.toNonIndexed();
  cg.translate(0, 0, -CW0 / 2);
  { const p = cg.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); let z = p.getZ(k);
      z *= 1 - 0.18 * Math.max(0, y - 0.9) / 0.3;
      z *= 1 - 0.45 * smooth(0.2, 1.6, x);
      p.setZ(k, z); } cg.computeVertexNormals(); }
  cg.rotateY(-Math.PI / 2);
  const cabin = new THREE.Mesh(cg, glass); cabin.castShadow = true; body.add(cabin);

  // measure for detail placement
  bg.computeBoundingBox();
  const bb = bg.boundingBox; // after rotation: z is forward
  const front = bb.max.z, rear = bb.min.z, halfW = bb.max.x;

  // --- lights
  const headMats = [headMat.clone(), headMat.clone()]; // [right(-x), left(+x)]
  for (const sx of [-1, 1]) {
    const hm = headMats[sx > 0 ? 1 : 0];
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.055, 0.2), hm);
    hl.position.set(sx * 0.55, 0.46, front - 0.24); hl.rotation.set(-0.15, sx * 0.4, 0); body.add(hl);
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.12), hm);
    drl.position.set(sx * 0.6, 0.42, front - 0.2); drl.rotation.set(-0.15, sx * 0.45, 0); body.add(drl);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.035, 0.06), tailMat);   // thin full-width light bar
  tail.position.set(0, 0.96, rear + 0.04); body.add(tail);

  // --- detachable panels: doors (hinged at the front edge) and bumpers
  const parts = [];
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 });
  for (const sx of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(sx * (halfW - 0.035), 0.6, 0.74); body.add(hinge);
    const door = new THREE.Group(); hinge.add(door);
    const panel = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.46, 1.22, 2, 0.02), paint); panel.position.set(sx * 0.012, 0, -0.62); panel.castShadow = true;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.49, 1.25), seamMat); seam.position.set(0, 0, -0.62);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.16), chrome); handle.position.set(sx * 0.042, 0.1, -1.0);
    door.add(seam, panel, handle);
    parts.push({ name: sx > 0 ? '左ドア' : '右ドア', obj: hinge, zone: sx > 0 ? 'left' : 'right', loose: 30, off: 62, kind: 'door', sx });
  }
  for (const [zf, z, y, name] of [[1, front - 0.2, 0.33, 'フロントバンパー'], [-1, rear + 0.1, 0.62, 'リアバンパー']]) {
    const piv = new THREE.Group(); piv.position.set(0.84, y, z); body.add(piv);
    const bm = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.16, 0.22), paint); bm.position.set(-0.84, 0, 0); bm.castShadow = true;
    const lip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.24), black); lip.position.set(-0.84, -0.095, 0);
    piv.add(bm, lip);
    parts.push({ name, obj: piv, zone: zf > 0 ? 'front' : 'rear', loose: 25, off: 55, kind: 'bumper', sx: 1 });
  }

  // --- black trim: diffuser, splitter, mirrors, side intake
  const diff = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.2), black); diff.position.set(0, 0.42, rear + 0.08); body.add(diff);
  const split = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.3), black); split.position.set(0, 0.24, front - 0.18); body.add(split);
  const under = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 3.9), black); under.position.set(0, 0.22, 0); body.add(under);
  for (const sx of [-1, 1]) {
    const mir = new THREE.Group(); mir.position.set(sx * (halfW - 0.25), 0.86, 0.85); mir.rotation.y = sx * 0.25; body.add(mir);
    mir.add(new THREE.Mesh(new RoundedMirror(), paint));
    const mg = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.055), chrome); mg.position.set(0, 0, -0.06); mg.rotation.y = Math.PI; mir.add(mg);
    parts.push({ name: sx > 0 ? '左ミラー' : '右ミラー', obj: mir, zone: sx > 0 ? 'left' : 'right', loose: 999, off: 22, kind: 'mirror', sx });
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.5), black); intake.position.set(sx * (halfW - 0.035), 0.62, -0.55); body.add(intake);
  }
  // license plates
  const plateMat = new THREE.MeshStandardMaterial({ map: T.plateTex(), roughness: 0.4 });
  // rear plate sits on the rear bumper's face (it used to be hidden behind it) and comes off with the bumper
  const rearBumper = parts.find((p) => p.name === 'リアバンパー').obj;
  const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), plateMat); pr.position.set(-0.84, 0.01, -0.113); pr.rotation.y = Math.PI; rearBumper.add(pr);
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), plateMat); pf.position.set(0, 0.36, front + 0.0); body.add(pf);

  // --- wheels
  const tireProfile = [];
  const TW = 0.27, RI = 0.23;
  for (let k = 0; k <= 12; k++) {
    const a = -Math.PI / 2 + Math.PI * k / 12;
    tireProfile.push(new THREE.Vector2(WR - 0.05 + Math.cos(a) * 0.05, Math.sin(a) * TW / 2));
  }
  tireProfile.unshift(new THREE.Vector2(RI, -TW / 2));
  tireProfile.push(new THREE.Vector2(RI, TW / 2));
  const tireG = new THREE.LatheGeometry(tireProfile, 32); tireG.rotateZ(Math.PI / 2);
  const rimParts = [];
  const disc = new THREE.CylinderGeometry(RI, RI, 0.04, 28); disc.rotateZ(Math.PI / 2); disc.translate(0.09, 0, 0); rimParts.push(disc);
  for (let k = 0; k < 10; k++) {
    const sp = new THREE.BoxGeometry(0.03, 0.2, k % 2 ? 0.035 : 0.05); sp.translate(0, 0.11, 0); sp.rotateX(k * Math.PI / 5); sp.translate(0.115, 0, 0); rimParts.push(sp);
  }
  const hub = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12); hub.rotateZ(Math.PI / 2); hub.translate(0.13, 0, 0); rimParts.push(hub);
  const lip = new THREE.TorusGeometry(RI - 0.005, 0.012, 6, 32); lip.rotateY(Math.PI / 2); lip.translate(0.12, 0, 0); rimParts.push(lip);
  const rimG = mergeGeometries(rimParts);
  const rotorG = new THREE.CylinderGeometry(0.17, 0.17, 0.025, 24); rotorG.rotateZ(Math.PI / 2);
  const caliperG = new THREE.BoxGeometry(0.06, 0.12, 0.16);
  const calMat = new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.4 });
  const wheels = [];
  for (const [sx, z, isFront] of [[1, XF, true], [-1, XF, true], [1, XR, false], [-1, XR, false]]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * (halfW - 0.17), WR, z); car.add(pivot);
    const spin = new THREE.Group(); pivot.add(spin);
    const tire = new THREE.Mesh(tireG, tireMat); tire.castShadow = true; spin.add(tire);
    const rim = new THREE.Mesh(rimG, rimMat); rim.scale.x = sx; spin.add(rim);
    const rotor = new THREE.Mesh(rotorG, chrome); rotor.position.x = sx * 0.02; pivot.add(rotor);
    const cal = new THREE.Mesh(caliperG, calMat); cal.position.set(sx * 0.05, 0.1, isFront ? -0.08 : 0.08); pivot.add(cal);
    wheels.push({ pivot, spin, front: isFront });
  }

  // contact shadow
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.0), new THREE.MeshBasicMaterial({ map: T.blobTex(), transparent: true, depthWrite: false, opacity: 0.85 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.025; blob.renderOrder = 3; car.add(blob);

  car.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  return { car, body, wheels, blob, bodyMesh, cabin, parts, headMats, paint, headMat, tailMat, glass, front, rear, halfW, materials: [paint, glass, chrome, rimMat, black] };
}
