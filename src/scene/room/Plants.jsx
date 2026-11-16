import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { leafGeometry } from '../../three/geometry'
import { mulberry32, pick, range } from '../../three/random'
import { leafTexture, potTexture, repeated } from '../../three/textures'

/** Zellige-glazed floor pot. */
function Pot({ scale = 1, ...props }) {
  const geo = useMemo(
    () => new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.24, 0.08], [0.28, 0.24], [0.26, 0.42], [0.2, 0.52], [0.22, 0.56], [0, 0.56]].map(([x, y]) => new THREE.Vector2(x, y)), 40),
    [],
  )
  const tex = useMemo(() => repeated(potTexture(), 3, 1.2), [])
  return (
    <mesh geometry={geo} scale={scale} {...props}>
      <meshStandardMaterial map={tex} roughness={0.3} />
    </mesh>
  )
}

const GREENS = ['#3f6b24', '#5a8a2c', '#2f5a1e', '#7aa338', '#4a7a2a', '#8fb04a']
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

/** Instanced leaves from an array of { p, rot, s, color }. */
function LeafCloud({ leaves, roughness = 0.55, petiole = 0, ...props }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const mesh = ref.current
    leaves.forEach((l, i) => {
      _e.set(l.rot[0], l.rot[1], l.rot[2], 'YXZ')
      _q.setFromEuler(_e)
      _p.set(...l.p)
      _s.set(l.s[0], l.s[1], l.s[2] ?? 1)
      _m.compose(_p, _q, _s)
      mesh.setMatrixAt(i, _m)
      mesh.setColorAt(i, _c.set(l.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [leaves])
  return (
    <instancedMesh ref={ref} args={[leafGeometry(petiole), undefined, leaves.length]} castShadow receiveShadow {...props}>
      <meshStandardMaterial map={leafTexture()} side={THREE.DoubleSide} roughness={roughness} envMapIntensity={0.6} />
    </instancedMesh>
  )
}

/** Trailing ivy: a bushy crown with strands hanging down. */
/** `front`: hanging strands stay at z ≥ front (local), so they pass in front of shelf boards instead of through them. */
export function Ivy({ strands = 8, length = [0.8, 1.6], spread = 0.45, leafSize = 0.1, crown = 26, seed = 1, colors = GREENS, front = -Infinity, ...props }) {
  const leaves = useMemo(() => {
    const r = mulberry32(seed)
    const out = []
    for (let i = 0; i < crown; i++) {
      const a = r() * Math.PI * 2
      const rad = r() * spread * 0.6
      out.push({
        p: [Math.cos(a) * rad, range(r, -0.05, 0.15), Math.sin(a) * rad * 0.5 + 0.05],
        rot: [range(r, -1.2, 0.4), range(r, -0.8, 0.8), range(r, 0, Math.PI * 2)],
        s: [leafSize * 2, leafSize * 1.4],
        color: pick(r, colors),
      })
    }
    for (let k = 0; k < strands; k++) {
      const sx = range(r, -spread, spread)
      const sz = range(r, -0.05, 0.12)
      const len = range(r, length[0], length[1])
      const phase = r() * 6
      const step = leafSize * 0.75
      for (let t = 0; t < len; t += step) {
        const f = t / len
        out.push({
          p: [sx + Math.sin(t * 3 + phase) * 0.05 + range(r, -0.03, 0.03), -t, Math.max(front, sz + f * 0.08)],
          rot: [range(r, -0.6, 0.6), range(r, -0.9, 0.9), Math.PI + range(r, -0.9, 0.9)],
          s: [leafSize * 1.6 * (1 - f * 0.35), leafSize * (1 - f * 0.35)],
          color: pick(r, colors),
        })
      }
    }
    return out
  }, [strands, length, spread, leafSize, crown, seed, colors, front])
  return <LeafCloud leaves={leaves} {...props} />
}

/** Broad-leaf floor plant in a zellige pot: leaves on long stems rising from the soil. */
export function BigPlant({ seed = 4, leaves: n = 22, ...props }) {
  const leaves = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: n }, (_, i) => {
      const yaw = (i / n) * Math.PI * 2 * 2.618 + range(r, -0.3, 0.3) // golden-angle spiral
      const inner = i < n * 0.35 // young leaves stand up in the middle
      const back = -Math.cos(yaw) // 1 = leaning toward the wall behind the plant
      const maxPitch = back > 0.3 ? 0.3 : back > -0.2 ? 0.75 : 1.2
      const pitch = inner ? range(r, 0.1, 0.4) : range(r, Math.min(0.55, maxPitch * 0.6), maxPitch)
      const len = inner ? range(r, 0.45, 0.7) : range(r, 0.6, 0.95)
      return {
        p: [Math.sin(yaw) * 0.03, 0.62, Math.cos(yaw) * 0.03],
        rot: [pitch, yaw, range(r, -0.25, 0.25)],
        s: [len * 0.95, len, len],
        color: pick(r, ["#3e6b2a", "#4f7f30", "#2f5a22", "#5e8f3a", "#466f2b"]),
      }
    })
  }, [seed, n])
  return (
    <group {...props}>
      <Pot scale={1.15} />
      {/* soil */}
      <mesh position-y={0.648} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.235, 28]} />
        <meshStandardMaterial color="#2a1a10" roughness={1} />
      </mesh>
      <LeafCloud leaves={leaves} petiole={0.55} />
    </group>
  )
}

/** Large, dark, out-of-focus leaves framing the shot (foreground). */
export function Foliage({ count = 9, size = [0.5, 1.2], spreadX = 0.6, spreadY = 0.6, seed = 9, droop = 0, ...props }) {
  const leaves = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: count }, () => {
      const len = range(r, size[0], size[1])
      return {
        p: [range(r, -spreadX, spreadX), range(r, -spreadY, spreadY), range(r, -0.2, 0.2)],
        rot: [range(r, -0.5, 0.5), range(r, -0.6, 0.6), droop + range(r, -1.2, 1.2)],
        s: [len * 0.5, len, 1],
        color: pick(r, ['#1d3317', '#24401b', '#2c4a1f', '#18291a']),
      }
    })
  }, [count, size, spreadX, spreadY, seed, droop])
  return <LeafCloud leaves={leaves} roughness={0.8} {...props} />
}

/** Palm silhouette for the view outside. */
export function Palm({ height = 5, frond = 1.6, seed = 3, ...props }) {
  const leaves = useMemo(() => {
    const r = mulberry32(seed)
    const n = 16
    return Array.from({ length: n }, (_, i) => ({
      p: [0, height, 0],
      rot: [Math.PI / 2 + range(r, 0.1, 0.7), (i / n) * Math.PI * 2 + range(r, -0.15, 0.15), 0],
      s: [frond * 0.28, frond * range(r, 0.8, 1.1), 1],
      color: pick(r, ['#2c3a26', '#34442a', '#263222']),
    }))
  }, [height, frond, seed])
  return (
    <group {...props}>
      <mesh position-y={height / 2}>
        <cylinderGeometry args={[0.09, 0.16, height, 8]} />
        <meshLambertMaterial color="#4a3428" />
      </mesh>
      <LeafCloud leaves={leaves} roughness={1} />
    </group>
  )
}
