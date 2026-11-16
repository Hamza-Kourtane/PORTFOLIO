import * as THREE from 'three'

/*
 * Real carved lattice geometry (mashrabiya / fanoos panels).
 * Builds an outline shape, punches geometric holes into it and extrudes it,
 * so light genuinely passes through the cut-outs — no flat images.
 */

const V = (x, y) => new THREE.Vector2(x, y)

export function starPts(cx, cy, r1, r2, n = 8, rot = 0) {
  const out = []
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? r2 : r1
    const a = rot + (k * Math.PI) / n
    out.push(V(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return out
}

const diamond = (cx, cy, hx, hy) => [V(cx, cy - hy), V(cx + hx, cy), V(cx, cy + hy), V(cx - hx, cy)]

function kite(cx, cy, ang, rIn, rOut, half) {
  const rMid = rIn + (rOut - rIn) * 0.45
  const p = (r, a) => V(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  return [p(rIn, ang), p(rMid, ang - half), p(rOut, ang), p(rMid, ang + half)]
}

/** Repeating girih: 8-point stars, 4-point stars at grid nodes, lozenges on the edges. */
function girihHoles(minX, minY, maxX, maxY, c) {
  const nx = Math.ceil((maxX - minX) / c) + 1
  const ny = Math.ceil((maxY - minY) / c) + 1
  const x0 = (minX + maxX) / 2 - (nx / 2) * c
  const y0 = (minY + maxY) / 2 - (ny / 2) * c
  const holes = []
  for (let i = -1; i <= nx; i++) {
    for (let j = -1; j <= ny; j++) {
      const cx = x0 + (i + 0.5) * c
      const cy = y0 + (j + 0.5) * c
      holes.push(starPts(cx, cy, c * 0.4, c * 0.25, 8, Math.PI / 8))
      holes.push(starPts(x0 + i * c, y0 + j * c, c * 0.24, c * 0.1, 4, 0))
      holes.push(diamond(x0 + i * c, cy, c * 0.1, c * 0.18))
      holes.push(diamond(cx, y0 + j * c, c * 0.18, c * 0.1))
    }
  }
  return holes
}

/** One big rosette per panel (fanoos lantern faces). */
function rosetteHoles(cx, cy, s) {
  const holes = [starPts(cx, cy, s * 0.24, s * 0.13, 8, Math.PI / 8)]
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8
    holes.push(kite(cx, cy, a, s * 0.32, s * 0.66, 0.2))
    holes.push(starPts(cx + Math.cos(a - Math.PI / 8) * s * 0.56, cy + Math.sin(a - Math.PI / 8) * s * 0.56, s * 0.09, s * 0.04, 4, a))
  }
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    holes.push([V(cx + sx * s * 0.86, cy + sy * s * 0.48), V(cx + sx * s * 0.86, cy + sy * s * 0.86), V(cx + sx * s * 0.48, cy + sy * s * 0.86)])
  }
  return holes
}

function pointInPoly(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x
    const yi = pts[i].y
    const xj = pts[j].x
    const yj = pts[j].y
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function distToPoly(px, py, pts) {
  let d = Infinity
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l2 = dx * dx + dy * dy
    let t = l2 ? ((px - a.x) * dx + (py - a.y) * dy) / l2 : 0
    t = Math.max(0, Math.min(1, t))
    d = Math.min(d, Math.hypot(a.x + t * dx - px, a.y + t * dy - py))
  }
  return d
}

/**
 * @param outer    Vector2[] outline of the panel
 * @param exclude  Vector2[][] regions that must stay solid (holes are kept away from them)
 * @param cutouts  Vector2[][] extra openings cut through as-is (e.g. an arch opening)
 * @param pattern  'girih' | 'rosette'
 */
export function carvedGeometry({ outer, exclude = [], cutouts = [], pattern = 'girih', cell = 0.25, margin = 0.03, depth = 0.02 }) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of outer) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const candidates =
    pattern === 'rosette'
      ? rosetteHoles((minX + maxX) / 2, (minY + maxY) / 2, Math.min(maxX - minX, maxY - minY) / 2)
      : girihHoles(minX, minY, maxX, maxY, cell)

  const blockers = [...exclude, ...cutouts]
  const ok = (h) => {
    const test = [...h]
    for (let i = 0; i < h.length; i++) {
      const a = h[i]
      const b = h[(i + 1) % h.length]
      test.push(V((a.x + b.x) / 2, (a.y + b.y) / 2))
    }
    return test.every(
      (p) =>
        pointInPoly(p.x, p.y, outer) &&
        distToPoly(p.x, p.y, outer) >= margin &&
        blockers.every((ex) => !pointInPoly(p.x, p.y, ex) && distToPoly(p.x, p.y, ex) >= margin),
    )
  }

  const shape = new THREE.Shape(outer)
  shape.holes = [...candidates.filter(ok), ...cutouts].map((h) => new THREE.Path(h))
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 })
}

/** Rectangle outline centred on the origin. */
export const rectPts = (w, h, cx = 0, cy = 0) => [V(cx - w / 2, cy - h / 2), V(cx + w / 2, cy - h / 2), V(cx + w / 2, cy + h / 2), V(cx - w / 2, cy + h / 2)]

/**
 * Inner edge of an arch with cusped (scalloped) lobes, Moroccan style.
 * Returns points from bottom-left, over the top, to bottom-right.
 */
export function scallopedArch(points, lobes = 9, depth = 0.12) {
  // arc length parametrisation over the curved part only
  const lens = [0]
  for (let i = 1; i < points.length; i++) lens.push(lens[i - 1] + points[i].distanceTo(points[i - 1]))
  const total = lens[lens.length - 1]
  const out = []
  for (let i = 0; i < points.length; i++) {
    const t = lens[i] / total
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(points.length - 1, i + 1)]
    const tx = next.x - prev.x
    const ty = next.y - prev.y
    const len = Math.hypot(tx, ty) || 1
    // inward normal (points are ordered left→right over the top, so inward is to the right of travel)
    const nx = ty / len
    const ny = -tx / len
    const lobe = Math.abs(Math.sin(t * lobes * Math.PI))
    const d = depth * (1 - Math.pow(lobe, 0.6))
    out.push(V(points[i].x + nx * d, points[i].y + ny * d))
  }
  return out
}
