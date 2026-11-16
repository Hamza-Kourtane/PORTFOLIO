import * as THREE from 'three'

/**
 * Outline of a pointed (Moroccan) arch, from bottom-left, up and over the
 * apex, down to bottom-right. rise = height of the arch above the spring line.
 */
export function archPoints({ width, spring, rise, cx = 0, base = 0, segments = 28 }) {
  const hw = width / 2
  const h = Math.max(rise, hw)
  const R = (hw * hw + h * h) / (2 * hw)
  const aEnd = Math.atan2(h, hw - R)
  const pts = [new THREE.Vector2(cx - hw, base)]
  const lcx = cx - hw + R
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI + (aEnd - Math.PI) * (i / segments)
    pts.push(new THREE.Vector2(lcx + Math.cos(a) * R, spring + Math.sin(a) * R))
  }
  const rcx = cx + hw - R
  const aStart = Math.PI - aEnd
  for (let i = 1; i <= segments; i++) {
    const a = aStart * (1 - i / segments)
    pts.push(new THREE.Vector2(rcx + Math.cos(a) * R, spring + Math.sin(a) * R))
  }
  pts.push(new THREE.Vector2(cx + hw, base))
  return pts
}

/** Filled arch silhouette. */
export const archShape = (p) => new THREE.Shape(archPoints(p))

/** U-shaped band between two arches (an arch frame open at the bottom). */
export function archBandShape(outer, inner) {
  const o = archPoints(outer)
  const i = archPoints({ ...inner, base: inner.base ?? outer.base ?? 0 }).reverse()
  return new THREE.Shape([...o, ...i])
}

/** Wall rectangle with an arched doorway notched out of the bottom. */
export function wallWithArchShape({ width, height, arch, bottom = -0.05 }) {
  const a = archPoints({ ...arch, base: bottom })
  return new THREE.Shape([
    new THREE.Vector2(-width / 2, bottom),
    ...a,
    new THREE.Vector2(width / 2, bottom),
    new THREE.Vector2(width / 2, height),
    new THREE.Vector2(-width / 2, height),
  ])
}

/** Rectangle (bottom→top) with an arch notched out of its bottom edge — U-shaped frame outline. */
export function rectWithArchNotch({ width, bottom, top, arch, cx = 0 }) {
  const a = archPoints({ ...arch, cx: (arch.cx ?? 0) + cx, base: bottom })
  return [new THREE.Vector2(cx - width / 2, bottom), ...a, new THREE.Vector2(cx + width / 2, bottom), new THREE.Vector2(cx + width / 2, top), new THREE.Vector2(cx - width / 2, top)]
}

/**
 * Region above `bottom` that wraps around the top of an arch: the arch is
 * notched out of the bottom edge, `topPts` (right → left) close the shape.
 * Used for carved crests / spandrels so they never cover the arch opening.
 */
export function crestAroundArch({ bottom, halfWidth, arch, topPts }) {
  const a = archPoints({ ...arch, base: bottom })
  return [new THREE.Vector2(-halfWidth, bottom), ...a, new THREE.Vector2(halfWidth, bottom), ...topPts]
}

/** Tube following an arch outline (LED strips). */
export function archTubeGeometry(arch, radius = 0.012, skipEnds = true) {
  let pts = archPoints(arch)
  if (skipEnds) pts = pts.slice(1, -1)
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)), false, 'centripetal')
  return new THREE.TubeGeometry(curve, 120, radius, 6)
}

/** Remap a planar geometry's UVs to 0..1 across its bounding box. */
export function normalizeUVs(geo) {
  geo.computeBoundingBox()
  const { min, max } = geo.boundingBox
  const uv = geo.attributes.uv
  const pos = geo.attributes.position
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - min.x) / (max.x - min.x), (pos.getY(i) - min.y) / (max.y - min.y))
  }
  uv.needsUpdate = true
  return geo
}

/**
 * Leaf: blade in the XY plane (base at the origin, tip at y = 1), folded along
 * the midrib, curling back toward the tip with a slightly wavy edge.
 * `petiole` adds a thin stem below the base (length in leaf units).
 * UVs: u across the blade (0.5 = midrib), v from base (0) to tip (1).
 */
const leafGeos = {}
export function leafGeometry(petiole = 0) {
  if (leafGeos[petiole]) return leafGeos[petiole]
  const NU = 8
  const rows = []
  if (petiole > 0) for (let k = 0; k < 4; k++) rows.push({ y: -petiole * (1 - k / 4), w: 0.016, v: 0, stem: true })
  const NV = 18
  for (let j = 0; j <= NV; j++) {
    const v = j / NV
    const w = 0.27 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.03 + v * 0.97)), 0.75) * (1 - 0.25 * v)
    rows.push({ y: v, w: Math.max(w, 0.004), v })
  }
  const pos = []
  const uv = []
  const idx = []
  rows.forEach((r, j) => {
    for (let i = 0; i <= NU; i++) {
      const u = i / NU
      const x = (u - 0.5) * 2 * r.w
      const fold = r.stem ? 0 : Math.abs(x) * 0.5
      const bend = r.stem ? -r.y * 0.15 : -r.v * r.v * 0.28
      const wave = r.stem ? 0 : Math.sin(r.v * 22) * 0.012 * Math.abs(u - 0.5) * 2
      pos.push(x, r.y, fold + bend + wave)
      uv.push(r.stem ? 0.5 : 0.5 + x / 0.8, r.stem ? 0.01 : r.v)
      if (j > 0 && i > 0) {
        const a = (j - 1) * (NU + 1) + i - 1
        const b = j * (NU + 1) + i - 1
        idx.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  if (petiole > 0) g.translate(0, petiole, 0) // origin at the bottom of the stem
  leafGeos[petiole] = g
  return g
}
