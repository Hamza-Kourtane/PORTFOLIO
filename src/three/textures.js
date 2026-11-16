import * as THREE from 'three'
import { mulberry32, pick } from './random'

/*
 * All surface patterns of the room are painted on canvases at runtime:
 * tadelakt walls, marble floor, girih lattice, zellige rosette, tile band,
 * rug, sky gradient, niche glow and the robot's face. No image assets needed.
 */

const cache = new Map()
const memo = (key, fn) => () => {
  if (!cache.has(key)) cache.set(key, fn())
  return cache.get(key)
}

function makeCanvas(w, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function finish(c, { srgb = true, wrap = true } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Clone of a cached texture with its own repeat. */
export function repeated(tex, rx, ry = rx) {
  const t = tex.clone()
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  return t
}

function starPath(ctx, cx, cy, r1, r2, n = 8, rot = 0) {
  ctx.beginPath()
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? r2 : r1
    const a = rot + (k * Math.PI) / n
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.closePath()
}

function polyPath(ctx, pts) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function blotches(ctx, w, h, rand, n, colors, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = rand() * w
    const y = rand() * h
    const r = rMin + rand() * (rMax - rMin)
    const col = pick(rand, colors)
    for (const dx of [-w, 0, w]) {
      for (const dy of [-h, 0, h]) {
        const X = x + dx
        const Y = y + dy
        if (X + r < 0 || X - r > w || Y + r < 0 || Y - r > h) continue
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, r)
        g.addColorStop(0, col)
        g.addColorStop(1, col + '00')
        ctx.globalAlpha = alpha
        ctx.fillStyle = g
        ctx.fillRect(X - r, Y - r, r * 2, r * 2)
      }
    }
  }
  ctx.globalAlpha = 1
}

function speckle(ctx, w, h, rand, n, color, alpha) {
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  for (let i = 0; i < n; i++) ctx.fillRect(rand() * w, rand() * h, 1 + rand(), 1 + rand())
  ctx.globalAlpha = 1
}

/* ---------------------------------------------------------------- walls */
export const wallTexture = memo('wall', () => {
  const S = 512
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(7)
  ctx.fillStyle = '#8d5a45'
  ctx.fillRect(0, 0, S, S)
  blotches(ctx, S, S, r, 170, ['#a8705a', '#6f4131', '#9a634c', '#b47a60'], 30, 120, 0.22)
  speckle(ctx, S, S, r, 7000, '#3a2018', 0.08)
  speckle(ctx, S, S, r, 4000, '#e0a888', 0.05)
  return finish(c)
})

/* ---------------------------------------------------------------- floor */
export const floorTexture = memo('floor', () => {
  const S = 512
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(11)
  ctx.fillStyle = '#d7b199'
  ctx.fillRect(0, 0, S, S)
  blotches(ctx, S, S, r, 90, ['#ead0b8', '#c39a80', '#dcb8a0'], 40, 150, 0.35)
  ctx.strokeStyle = '#f3e2cf'
  for (let i = 0; i < 12; i++) {
    ctx.globalAlpha = 0.15 + r() * 0.25
    ctx.lineWidth = 0.6 + r() * 1.4
    ctx.beginPath()
    ctx.moveTo(r() * S, r() * S)
    ctx.bezierCurveTo(r() * S, r() * S, r() * S, r() * S, r() * S, r() * S)
    ctx.stroke()
  }
  ctx.globalAlpha = 0.7
  ctx.strokeStyle = '#a57d66'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, S, S)
  ctx.beginPath()
  ctx.moveTo(S / 2, 0)
  ctx.lineTo(S / 2, S)
  ctx.moveTo(0, S / 2)
  ctx.lineTo(S, S / 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  return finish(c)
})

/* ---------------------------------------------------------------- girih lattice */
function drawLattice(ctx, S, color, lw) {
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const centers = [[S / 2, S / 2], [0, 0], [S, 0], [0, S], [S, S]]
  for (const [x, y] of centers) {
    starPath(ctx, x, y, S * 0.3, S * 0.17, 8, Math.PI / 8)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, S * 0.075, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (const [x, y] of [[S / 2, 0], [0, S / 2], [S, S / 2], [S / 2, S]]) {
    starPath(ctx, x, y, S * 0.16, S * 0.08, 4, 0)
    ctx.stroke()
  }
  polyPath(ctx, [[S / 2, 0], [S, S / 2], [S / 2, S], [0, S / 2]])
  ctx.stroke()
  const oct = []
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8
    oct.push([S / 2 + Math.cos(a) * S * 0.43, S / 2 + Math.sin(a) * S * 0.43])
  }
  polyPath(ctx, oct)
  ctx.stroke()
}

/** Back-lit lattice: bright amber holes, dark carved wood. Use as map + emissiveMap. */
export const latticeGlowTexture = memo('latticeGlow', () => {
  const S = 256
  const [c, ctx] = makeCanvas(S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.75)
  g.addColorStop(0, '#ffd27a')
  g.addColorStop(1, '#ffab45')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  drawLattice(ctx, S, '#3a1a0a', S * 0.075)
  return finish(c)
})

/** Carved wood/plaster lattice with dark recessed holes (unlit). */
export const latticeWoodTexture = memo('latticeWood', () => {
  const S = 256
  const [c, ctx] = makeCanvas(S)
  ctx.fillStyle = '#3a1c0e'
  ctx.fillRect(0, 0, S, S)
  drawLattice(ctx, S, '#c48a55', S * 0.075)
  return finish(c)
})

/** White lattice on black — used as an alpha cut-out. */
export const latticeAlphaTexture = memo('latticeAlpha', () => {
  const S = 256
  const [c, ctx] = makeCanvas(S)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, S, S)
  drawLattice(ctx, S, '#fff', S * 0.08)
  return finish(c, { srgb: false })
})

/* ---------------------------------------------------------------- zellige */
function kiteRing(ctx, cx, cy, n, rIn, rOut, halfAng, colors, offset = 0, grout = '#2a1d14') {
  const rMid = rIn + (rOut - rIn) * 0.42
  for (let k = 0; k < n; k++) {
    const a = offset + (k * Math.PI * 2) / n
    const p = (r, ang) => [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]
    polyPath(ctx, [p(rIn, a), p(rMid, a - halfAng), p(rOut, a), p(rMid, a + halfAng)])
    ctx.fillStyle = colors[k % colors.length]
    ctx.fill()
    ctx.strokeStyle = grout
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

/** Large zellige rosette for the arched mosaic window. */
export const rosetteTexture = memo('rosette', () => {
  const S = 1024
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(3)
  const cx = S / 2
  const cy = S * 0.56
  ctx.fillStyle = '#183f40'
  ctx.fillRect(0, 0, S, S)
  const cell = 44
  for (let y = 0; y < S; y += cell) {
    for (let x = 0; x < S; x += cell) {
      const col = pick(r, ['#ecdfc4', '#1f6b66', '#163a3c', '#c97b32', '#ecdfc4', '#2d8a80'])
      polyPath(ctx, [[x + cell / 2, y + 3], [x + cell - 3, y + cell / 2], [x + cell / 2, y + cell - 3], [x + 3, y + cell / 2]])
      ctx.fillStyle = col
      ctx.fill()
      ctx.strokeStyle = '#2a1d14'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
  ctx.beginPath()
  ctx.arc(cx, cy, 480, 0, Math.PI * 2)
  ctx.fillStyle = '#efe2c6'
  ctx.fill()
  kiteRing(ctx, cx, cy, 24, 330, 478, Math.PI / 24 * 0.92, ['#1f6b66', '#c97b32', '#0f3b3b'])
  kiteRing(ctx, cx, cy, 24, 360, 455, Math.PI / 60, ['#efe2c6'], Math.PI / 24)
  ctx.beginPath()
  ctx.arc(cx, cy, 330, 0, Math.PI * 2)
  ctx.fillStyle = '#ecdfc4'
  ctx.fill()
  starPath(ctx, cx, cy, 322, 245, 16, 0)
  ctx.fillStyle = '#1d5e5b'
  ctx.fill()
  ctx.strokeStyle = '#2a1d14'
  ctx.lineWidth = 4
  ctx.stroke()
  kiteRing(ctx, cx, cy, 16, 135, 270, Math.PI / 16 * 0.8, ['#efe2c6', '#d38a3a'], Math.PI / 16)
  starPath(ctx, cx, cy, 140, 90, 8, Math.PI / 8)
  ctx.fillStyle = '#163a3c'
  ctx.fill()
  ctx.stroke()
  starPath(ctx, cx, cy, 78, 44, 8, 0)
  ctx.fillStyle = '#d38a3a'
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, 24, 0, Math.PI * 2)
  ctx.fillStyle = '#1f6b66'
  ctx.fill()
  ctx.stroke()
  return finish(c, { wrap: false })
})

/** Repeating zellige strip for the wainscot / floor inlay. */
export const tileBandTexture = memo('tileBand', () => {
  const S = 256
  const [c, ctx] = makeCanvas(S)
  ctx.fillStyle = '#16303d'
  ctx.fillRect(0, 0, S, S)
  const n = 4
  const cs = S / n
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cx = i * cs + cs / 2
      const cy = j * cs + cs / 2
      if ((i + j) % 2 === 0) {
        starPath(ctx, cx, cy, cs * 0.42, cs * 0.22, 8, Math.PI / 8)
        ctx.fillStyle = '#ece4d2'
        ctx.fill()
        ctx.strokeStyle = '#0b1820'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx, cy, cs * 0.1, 0, Math.PI * 2)
        ctx.fillStyle = '#2a7a74'
        ctx.fill()
      } else {
        polyPath(ctx, [[cx, cy - cs * 0.4], [cx + cs * 0.4, cy], [cx, cy + cs * 0.4], [cx - cs * 0.4, cy]])
        ctx.fillStyle = '#2a7a74'
        ctx.fill()
        ctx.strokeStyle = '#0b1820'
        ctx.lineWidth = 2
        ctx.stroke()
        polyPath(ctx, [[cx, cy - cs * 0.16], [cx + cs * 0.16, cy], [cx, cy + cs * 0.16], [cx - cs * 0.16, cy]])
        ctx.fillStyle = '#c9782e'
        ctx.fill()
      }
    }
  }
  ctx.fillStyle = '#ece4d2'
  ctx.fillRect(0, 0, S, 5)
  ctx.fillRect(0, S - 5, S, 5)
  return finish(c)
})

/** Small mosaic for the plant pot and decorative plate. */
export const potTexture = memo('pot', () => {
  const S = 256
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(21)
  ctx.fillStyle = '#efe6d4'
  ctx.fillRect(0, 0, S, S)
  const cs = 16
  for (let y = 0; y < S; y += cs) {
    for (let x = 0; x < S; x += cs) {
      polyPath(ctx, [[x + cs / 2, y + 1], [x + cs - 1, y + cs / 2], [x + cs / 2, y + cs - 1], [x + 1, y + cs / 2]])
      ctx.fillStyle = pick(r, ['#16404a', '#1f6a6a', '#efe6d4', '#2a2a38', '#efe6d4', '#c46d2c'])
      ctx.fill()
    }
  }
  return finish(c)
})

/* ---------------------------------------------------------------- rug */
export const rugTexture = memo('rug', () => {
  const W = 1024
  const H = 640
  const [c, ctx] = makeCanvas(W, H)
  const r = mulberry32(5)
  const navy = '#1c2440'
  const cream = '#e9d6b4'
  const orange = '#c8642a'
  ctx.fillStyle = navy
  ctx.fillRect(0, 0, W, H)
  // outer motif band
  for (let x = 30; x < W; x += 34) {
    for (const y of [22, H - 22]) {
      polyPath(ctx, [[x, y - 9], [x + 9, y], [x, y + 9], [x - 9, y]])
      ctx.fillStyle = cream
      ctx.fill()
    }
  }
  for (let y = 56; y < H - 40; y += 34) {
    for (const x of [22, W - 22]) {
      polyPath(ctx, [[x, y - 9], [x + 9, y], [x, y + 9], [x - 9, y]])
      ctx.fillStyle = cream
      ctx.fill()
    }
  }
  ctx.fillStyle = '#5e1410'
  ctx.fillRect(44, 44, W - 88, H - 88)
  for (let x = 70; x < W - 60; x += 40) {
    for (const y of [70, H - 70]) {
      starPath(ctx, x, y, 14, 7, 4, 0)
      ctx.fillStyle = orange
      ctx.fill()
    }
  }
  for (let y = 110; y < H - 90; y += 40) {
    for (const x of [70, W - 70]) {
      starPath(ctx, x, y, 14, 7, 4, 0)
      ctx.fillStyle = orange
      ctx.fill()
    }
  }
  ctx.strokeStyle = cream
  ctx.lineWidth = 4
  ctx.strokeRect(96, 96, W - 192, H - 192)
  ctx.fillStyle = '#8a1f17'
  ctx.fillRect(100, 100, W - 200, H - 200)
  // field motifs
  for (let i = 0; i < 70; i++) {
    const x = 130 + r() * (W - 260)
    const y = 130 + r() * (H - 260)
    if (Math.abs(x - W / 2) < 250 && Math.abs(y - H / 2) < 170) continue
    starPath(ctx, x, y, 10, 5, 8, 0)
    ctx.fillStyle = pick(r, [cream, orange, navy])
    ctx.fill()
  }
  // corner quarter medallions
  for (const [x, y, sx, sy] of [[100, 100, 1, 1], [W - 100, 100, -1, 1], [100, H - 100, 1, -1], [W - 100, H - 100, -1, -1]]) {
    polyPath(ctx, [[x, y], [x + sx * 150, y], [x, y + sy * 110]])
    ctx.fillStyle = navy
    ctx.fill()
    polyPath(ctx, [[x, y], [x + sx * 95, y], [x, y + sy * 70]])
    ctx.fillStyle = orange
    ctx.fill()
  }
  // central medallion
  const cx = W / 2
  const cy = H / 2
  const dia = (rx, ry, col) => {
    polyPath(ctx, [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]])
    ctx.fillStyle = col
    ctx.fill()
  }
  dia(240, 170, navy)
  dia(200, 140, cream)
  dia(185, 128, orange)
  dia(130, 92, '#7a1a15')
  dia(80, 58, navy)
  starPath(ctx, cx, cy, 44, 22, 8, 0)
  ctx.fillStyle = cream
  ctx.fill()
  speckle(ctx, W, H, r, 26000, '#000000', 0.1)
  speckle(ctx, W, H, r, 9000, '#ffd0a0', 0.06)
  return finish(c, { wrap: false })
})

/* ---------------------------------------------------------------- sky & glow */
export const skyTexture = memo('sky', () => {
  const [c, ctx] = makeCanvas(4, 512)
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0.0, '#262a5e')
  g.addColorStop(0.3, '#55559a')
  g.addColorStop(0.42, '#9c72aa')
  g.addColorStop(0.47, '#e08e98')
  g.addColorStop(0.5, '#ffbf8c')
  g.addColorStop(0.53, '#e59272')
  g.addColorStop(1.0, '#4a2a30')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 512)
  return finish(c, { wrap: false })
})

export const glowTexture = memo('glow', () => {
  const [c, ctx] = makeCanvas(256, 512)
  const g = ctx.createRadialGradient(128, 340, 0, 128, 300, 330)
  g.addColorStop(0, '#fff0c0')
  g.addColorStop(0.35, '#ffb24a')
  g.addColorStop(0.75, '#e0661a')
  g.addColorStop(1, '#8a3210')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 512)
  return finish(c, { wrap: false })
})

export const sunTexture = memo('sun', () => {
  const [c, ctx] = makeCanvas(256)
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,245,215,1)')
  g.addColorStop(0.15, 'rgba(255,210,150,0.8)')
  g.addColorStop(0.5, 'rgba(255,150,110,0.25)')
  g.addColorStop(1, 'rgba(255,120,100,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return finish(c, { wrap: false })
})

/* ================================================================ PBR helpers */
/* Grayscale canvases double as bump maps; colour maps are tinted versions.   */

function noise1d(x, seed) {
  return (
    Math.sin(x * 1.7 + seed) * 0.5 +
    Math.sin(x * 3.1 + seed * 2.3) * 0.25 +
    Math.sin(x * 7.3 + seed * 0.7) * 0.15 +
    Math.sin(x * 13.7 + seed * 5.1) * 0.1
  )
}

function grainCanvas(S, seed) {
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(seed)
  const img = ctx.createImageData(S, S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const warp = noise1d(x * 0.006, seed) * 7 + noise1d(y * 0.004, seed + 3) * 4
      const ring = Math.sin((y + warp) * 0.11) * 0.5 + 0.5
      const fine = Math.sin((y + warp * 1.3) * 0.9 + noise1d(x * 0.05, seed + 9)) * 0.5 + 0.5
      const v = 0.8 + ring * 0.12 + fine * 0.05 + (r() - 0.5) * 0.04
      const i = (y * S + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v * 255))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

function tint(src, color) {
  const [c, ctx] = makeCanvas(src.width, src.height)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(src, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  return c
}

const woodGrain = memo('woodGrain', () => grainCanvas(512, 4))

/** Walnut wood: { map, bump } — grain runs along X. */
export function woodTextures(color = '#8b4a22') {
  return memo('wood' + color, () => ({
    map: finish(tint(woodGrain(), color)),
    bump: finish(woodGrain(), { srgb: false }),
  }))()
}

/** Leather grain + soft wrinkles (bump only; colour comes from the material). */
export const leatherBump = memo('leatherBump', () => {
  const S = 512
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(31)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, S, S)
  blotches(ctx, S, S, r, 900, ['#9a9a9a', '#666666'], 2, 7, 0.55)
  ctx.strokeStyle = '#5a5a5a'
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.25 + r() * 0.3
    ctx.lineWidth = 0.6 + r() * 1.4
    ctx.beginPath()
    const x = r() * S
    const y = r() * S
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60, x + (r() - 0.5) * 90, y + (r() - 0.5) * 90)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return finish(c, { srgb: false })
})

/** Hand-troweled plaster (tadelakt). */
export const plasterBump = memo('plasterBump', () => {
  const S = 512
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(17)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, S, S)
  blotches(ctx, S, S, r, 260, ['#a0a0a0', '#606060'], 20, 90, 0.35)
  speckle(ctx, S, S, r, 9000, '#404040', 0.12)
  return finish(c, { srgb: false })
})

/** Engraved metal for the tea tray. */
export const engravedBump = memo('engraved', () => {
  const S = 512
  const [c, ctx] = makeCanvas(S)
  ctx.fillStyle = '#909090'
  ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = '#4a4a4a'
  ctx.lineWidth = 3
  for (const rr of [60, 120, 200, 236]) {
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, rr, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8
    ctx.beginPath()
    ctx.moveTo(S / 2 + Math.cos(a) * 120, S / 2 + Math.sin(a) * 120)
    ctx.quadraticCurveTo(S / 2 + Math.cos(a + 0.2) * 170, S / 2 + Math.sin(a + 0.2) * 170, S / 2 + Math.cos(a) * 200, S / 2 + Math.sin(a) * 200)
    ctx.stroke()
  }
  ctx.lineWidth = 2
  starPath(ctx, S / 2, S / 2, 56, 30, 8, 0)
  ctx.stroke()
  return finish(c, { srgb: false, wrap: false })
})

/* ================================================================ robot LED face */
function dotLine(ctx, pts, spacing = 15, r = 6.5) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / spacing))
    for (let k = 0; k <= n; k++) {
      ctx.beginPath()
      ctx.arc(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const arcPts = (cx, cy, r, a0, a1, n = 14) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })

/** LED pixel face. expression: happy | excited | thinking | surprised | wink | sleeping */
export function robotFaceTexture(expression = 'happy') {
  return memo('face-' + expression, () => {
    const W = 512
    const H = 330
    const [c, ctx] = makeCanvas(W, H)
    ctx.fillStyle = '#050507'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#ffb347'
    ctx.shadowColor = '#ff8a00'
    ctx.shadowBlur = 16
    const happyEye = (x) => dotLine(ctx, arcPts(x, 165, 44, Math.PI * 1.1, Math.PI * 1.9))
    const smile = () => dotLine(ctx, arcPts(256, 170, 60, Math.PI * 0.22, Math.PI * 0.78))
    switch (expression) {
      case 'wink':
        happyEye(168)
        dotLine(ctx, [[300, 140], [350, 160], [300, 180]])
        smile()
        break
      case 'sleeping':
        dotLine(ctx, arcPts(168, 140, 40, Math.PI * 0.15, Math.PI * 0.85))
        dotLine(ctx, arcPts(344, 140, 40, Math.PI * 0.15, Math.PI * 0.85))
        dotLine(ctx, [[220, 240], [292, 240]])
        break
      case 'excited':
        dotLine(ctx, [[140, 120], [195, 150], [140, 180]])
        dotLine(ctx, [[372, 120], [317, 150], [372, 180]])
        dotLine(ctx, arcPts(256, 200, 40, 0, Math.PI))
        break
      case 'surprised':
        dotLine(ctx, arcPts(168, 150, 26, 0, Math.PI * 2, 12))
        dotLine(ctx, arcPts(344, 150, 30, 0, Math.PI * 2, 12))
        dotLine(ctx, arcPts(256, 235, 18, 0, Math.PI * 2, 10))
        break
      case 'thinking':
        dotLine(ctx, arcPts(168, 155, 12, 0, Math.PI * 2, 8))
        dotLine(ctx, arcPts(344, 155, 12, 0, Math.PI * 2, 8))
        dotLine(ctx, [[230, 235], [282, 230]])
        break
      default:
        happyEye(168)
        happyEye(344)
        smile()
    }
    return finish(c, { wrap: false })
  })()
}

/** Rubber shoe-sole tread (orange). */
export const soleTexture = memo('sole', () => {
  const S = 256
  const [c, ctx] = makeCanvas(S)
  ctx.fillStyle = '#e0792a'
  ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = '#b8561a'
  ctx.lineWidth = 6
  for (let y = 20; y < S; y += 30) {
    ctx.beginPath()
    for (let x = 0; x <= S; x += 32) ctx.lineTo(x, y + ((x / 32) % 2 ? 10 : -10))
    ctx.stroke()
  }
  ctx.lineWidth = 10
  ctx.strokeRect(10, 10, S - 20, S - 20)
  return finish(c, { wrap: false })
})

/** Desktop wallpaper: mountains at sunset (MacBook screen). */
export const wallpaperTexture = memo('wallpaper', () => {
  const W = 512
  const H = 320
  const [c, ctx] = makeCanvas(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#3a2a6a')
  g.addColorStop(0.45, '#c86a8a')
  g.addColorStop(0.7, '#ffb07a')
  g.addColorStop(1, '#ffcf9a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const ridge = (base, amp, color, seed) => {
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base - Math.abs(noise1d(x * 0.012, seed)) * amp)
    ctx.lineTo(W, H)
    ctx.fillStyle = color
    ctx.fill()
  }
  ridge(230, 90, '#7a4a7a', 1)
  ridge(260, 70, '#4a2a4a', 4)
  ridge(300, 40, '#2a1428', 7)
  return finish(c, { wrap: false })
})

/* ================================================================ leaves */
/**
 * Leaf surface (near-white so per-leaf instance colours tint it): lighter midrib,
 * curved side veins, darker edges, fine mottling. u across, v base → tip.
 */
export const leafTexture = memo('leaf', () => {
  const W = 128
  const H = 256
  const [c, ctx] = makeCanvas(W, H)
  const r = mulberry32(57)
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, '#8f948a')
  g.addColorStop(0.25, '#d4d8cc')
  g.addColorStop(0.5, '#e8ebe0')
  g.addColorStop(0.75, '#d4d8cc')
  g.addColorStop(1, '#8f948a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // tip a touch lighter, base a touch darker (canvas top = leaf tip)
  const v = ctx.createLinearGradient(0, 0, 0, H)
  v.addColorStop(0, 'rgba(255,255,230,0.18)')
  v.addColorStop(1, 'rgba(40,50,30,0.18)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
  speckle(ctx, W, H, r, 2500, '#6f7566', 0.18)
  // side veins
  ctx.strokeStyle = 'rgba(250,255,225,0.55)'
  ctx.lineWidth = 1.4
  for (let y = H - 18; y > 16; y -= 19) {
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(W / 2, y)
      ctx.quadraticCurveTo(W / 2 + s * 26, y - 14, W / 2 + s * 56, y - 40)
      ctx.stroke()
    }
  }
  // midrib
  ctx.strokeStyle = '#f6fbe0'
  ctx.lineCap = 'round'
  for (let y = 0; y < H; y += 4) {
    ctx.lineWidth = 1.2 + (y / H) * 3
    ctx.beginPath()
    ctx.moveTo(W / 2, y)
    ctx.lineTo(W / 2, y + 4)
    ctx.stroke()
  }
  return finish(c, { wrap: false })
})

/** Soft round puff for steam / smoke sprites. */
export const puffTexture = memo('puff', () => {
  const S = 128
  const [c, ctx] = makeCanvas(S)
  const r = mulberry32(8)
  for (let i = 0; i < 9; i++) {
    const x = S / 2 + (r() - 0.5) * S * 0.3
    const y = S / 2 + (r() - 0.5) * S * 0.3
    const rad = S * (0.22 + r() * 0.18)
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, 'rgba(255,255,255,0.32)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
  }
  return finish(c, { wrap: false })
})
