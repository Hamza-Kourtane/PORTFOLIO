import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { skyTexture, sunTexture } from '../../three/textures'
import { mulberry32, pick, range } from '../../three/random'
import { Palm } from './Plants'

/*
 * Sunset view through the arch: a dense Moroccan medina that fills the whole
 * view from any camera angle — flat roofs with parapets, rooftop huts and
 * water tanks, green-tiled domes, arched windows (some lit), the old city
 * rampart, three minarets, palms, the Atlas behind, and birds crossing the sky.
 */

const HAZE = new THREE.Color('#c98a8e')
const smooth = THREE.MathUtils.smoothstep

/** Height of the rooftops at a given depth (the city climbs a gentle hill). */
const roofAt = (z) => -7.5 + (-z - 9) * 0.075

export default function Outside() {
  const palms = useMemo(() => {
    const r = mulberry32(77)
    const list = [
      [-3.9, -2.4, -12, 5.1, 1.25],
      [-5.6, -3, -16, 5.4, 1.3],
      [0.7, -3.5, -26, 6, 1.7],
      [1.9, -4, -34, 6.3, 1.8],
    ]
    for (let i = 0; i < 16; i++) {
      const z = range(r, -14, -70)
      const x = range(r, -22 - -z * 0.6, 22 + -z * 0.6)
      if (Math.abs(x) < 3 && z > -40) continue // keep the main view clear
      list.push([x, roofAt(z) - 1, z, range(r, 5, 7.5), range(r, 1.3, 2)])
    }
    return list
  }, [])

  return (
    <group>
      <Sky />
      <Mountains />
      <City />
      <Rampart z={-74} />
      <Minaret position={[-4.4, -10, -60]} />
      <Minaret position={[34, roofAt(-115) - 3, -115]} scale={0.75} />
      <Minaret position={[-46, roofAt(-140) - 3, -140]} scale={0.7} />
      {palms.map(([x, y, z, h, f], i) => (
        <Palm key={i} position={[x, y, z]} height={h} frond={f} seed={i * 7 + 3} />
      ))}
      <Birds />
      {/* ground far below, so no gap can ever show between buildings */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -14, -120]}>
        <planeGeometry args={[900, 260]} />
        <meshBasicMaterial color="#5e3128" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Sky() {
  const tex = skyTexture()
  const sun = sunTexture()
  return (
    <>
      <mesh>
        <sphereGeometry args={[320, 32, 32]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} toneMapped={false} fog={false} />
      </mesh>
      <sprite position={[-6, 9, -230]} scale={[70, 70, 1]}>
        <spriteMaterial map={sun} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </>
  )
}

/* ---------------------------------------------------------------- Atlas mountains */
function ridge(seed, z, base, peak, color, rough = 12) {
  const r = mulberry32(seed)
  const pts = [new THREE.Vector2(-460, base)]
  for (let x = -460; x <= 460; x += rough) pts.push(new THREE.Vector2(x, peak * (0.55 + r() * 0.45) + Math.sin(x * 0.03) * 2 + Math.sin(x * 0.011 + seed) * peak * 0.3))
  pts.push(new THREE.Vector2(460, base))
  return { geo: new THREE.ShapeGeometry(new THREE.Shape(pts)), z, color }
}

function Mountains() {
  const ridges = useMemo(
    () => [
      ridge(3, -280, -40, 26, '#a98aa8', 16), // far, highest (snow-dusted pink)
      ridge(1, -250, -40, 18, '#8f6c9c'),
      ridge(2, -220, -40, 11, '#6f4f80', 9),
    ],
    [],
  )
  return ridges.map((r, i) => (
    <mesh key={i} geometry={r.geo} position-z={r.z}>
      <meshBasicMaterial color={r.color} toneMapped={false} fog={false} />
    </mesh>
  ))
}

/* ---------------------------------------------------------------- the medina */
const WALLS = ['#c98a6a', '#b8775a', '#d49a78', '#a86a52', '#c48466', '#dba184', '#b9705a']

/** Window outline with a rounded (horseshoe-ish) top, 1 × 1.5 units. */
const archWindowGeo = (() => {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0)
  s.lineTo(0.5, 0)
  s.lineTo(0.5, 1)
  s.absarc(0, 1, 0.5, 0, Math.PI, false)
  s.lineTo(-0.5, 0)
  return new THREE.ShapeGeometry(s, 8)
})()

const domeGeo = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)
const tankGeo = new THREE.CylinderGeometry(1, 1, 1, 12)
const boxGeo = new THREE.BoxGeometry()

function buildCity() {
  const r = mulberry32(42)
  const out = { walls: [], parapets: [], huts: [], tanks: [], domes: [], lit: [], dark: [] }
  // rows of buildings from just past the balcony to the foot of the mountains
  for (let z = -9; z > -210; ) {
    const depth = -z
    const scale = 1 + depth / 70 // far buildings are drawn as bigger blocks
    const spread = 24 + depth * 1.35
    let x = -spread + range(r, 0, 3)
    while (x < spread) {
      const sx = range(r, 2.2, 5) * scale
      const sz = range(r, 2, 4.5) * scale
      const cx = x + sx / 2
      const cz = z - sz / 2 + range(r, -0.6, 0.6)
      // keep the space right behind the balcony a little lower and calmer
      const top = roofAt(cz) + range(r, -1.2, 1.7) + (depth < 20 && Math.abs(cx) < 6 ? -1.5 : 0)
      const bottom = -30
      const haze = smooth(depth, 25, 200) * 0.62
      const color = new THREE.Color(pick(r, WALLS)).lerp(HAZE, haze)
      out.walls.push({ p: [cx, (top + bottom) / 2, cz], s: [sx, top - bottom, sz], color })

      if (depth < 110) {
        // parapet around the flat roof
        out.parapets.push({ p: [cx, top + 0.18, cz], s: [sx + 0.18, 0.36, sz + 0.18], color: color.clone().offsetHSL(0, -0.05, 0.05) })
        // stair hut / small room on the roof
        if (r() < 0.38) {
          const hx = cx + range(r, -sx / 3, sx / 3)
          const hz = cz + range(r, -sz / 3, sz / 3)
          out.huts.push({ p: [hx, top + 0.6, hz], s: [sx * 0.28, 1.2, sz * 0.3], color: color.clone().offsetHSL(0, 0, -0.04) })
        }
        if (depth < 70 && r() < 0.18) out.tanks.push({ p: [cx + range(r, -sx / 3, sx / 3), top + 0.5, cz + range(r, -sz / 3, sz / 3)], s: [0.35, 0.8, 0.35], color: new THREE.Color('#e8e0d4').lerp(HAZE, haze) })
        if (r() < 0.035) {
          const rad = Math.min(sx, sz) * 0.32
          out.domes.push({ p: [cx, top + 0.36, cz], s: [rad, rad * 0.9, rad], color: new THREE.Color('#2f6b55').lerp(HAZE, haze * 0.8) })
        }
        // arched windows on the street-facing side, two floors
        const cols = Math.max(1, Math.floor(sx / 1.4))
        for (const fy of [1.9, 4.2]) {
          for (let c = 0; c < cols; c++) {
            if (r() < 0.25) continue
            const wx = cx - sx / 2 + ((c + 0.5) * sx) / cols
            const ws = Math.min(scale, 1.3)
            const w = { p: [wx, top - fy, cz + sz / 2 + 0.02], s: [0.4 * ws, 0.56 * ws, 1] }
            ;(r() < 0.36 ? out.lit : out.dark).push(w)
          }
        }
      } else if (r() < 0.25) {
        out.lit.push({ p: [cx + range(r, -sx / 3, sx / 3), top - range(r, 1, 3), cz + sz / 2 + 0.02], s: [0.32 * scale, 0.42 * scale, 1] })
      }
      x += sx + range(r, 0.15, 0.9) * scale
    }
    z -= range(r, 2.4, 3.6) + depth * 0.035
  }
  return out
}

function Instances({ items, geometry, children, ...props }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    items.forEach((d, i) => {
      m.compose(p.set(...d.p), q, s.set(...d.s))
      ref.current.setMatrixAt(i, m)
      if (d.color) ref.current.setColorAt(i, d.color)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [items])
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} frustumCulled={false} {...props}>
      {children}
    </instancedMesh>
  )
}

function City() {
  const c = useMemo(buildCity, [])
  return (
    <>
      <Instances items={c.walls} geometry={boxGeo}>
        <meshLambertMaterial emissive="#3a1a18" />
      </Instances>
      <Instances items={c.parapets} geometry={boxGeo}>
        <meshLambertMaterial emissive="#3a1a18" />
      </Instances>
      <Instances items={c.huts} geometry={boxGeo}>
        <meshLambertMaterial emissive="#3a1a18" />
      </Instances>
      <Instances items={c.tanks} geometry={tankGeo}>
        <meshLambertMaterial emissive="#2a2420" />
      </Instances>
      <Instances items={c.domes} geometry={domeGeo}>
        <meshStandardMaterial emissive="#0e2a20" roughness={0.35} metalness={0.2} />
      </Instances>
      <Instances items={c.dark} geometry={archWindowGeo}>
        <meshBasicMaterial color="#4a2620" />
      </Instances>
      <Instances items={c.lit} geometry={archWindowGeo}>
        <meshBasicMaterial color={[1.45, 0.95, 0.42]} toneMapped={false} />
      </Instances>
    </>
  )
}

/** Old city wall (ramparts) with square towers and crenellations. */
function Rampart({ z }) {
  const parts = useMemo(() => {
    const r = mulberry32(9)
    const top = roofAt(z) + 1.6
    const color = new THREE.Color('#b56a48').lerp(HAZE, 0.3)
    const wall = [{ p: [0, (top - 30) / 2, z], s: [260, top + 30, 1.6], color }]
    const merlons = []
    for (let x = -130; x <= 130; x += 1.1) merlons.push({ p: [x, top + 0.35, z + 0.4], s: [0.6, 0.7, 0.6], color })
    const towers = []
    for (let x = -120; x <= 120; x += range(r, 14, 22)) towers.push({ p: [x, top - 13, z + 0.6], s: [3, 30, 3.2], color: color.clone().offsetHSL(0, 0, -0.03) })
    return { wall, merlons, towers }
  }, [z])
  return (
    <>
      <Instances items={parts.wall} geometry={boxGeo}>
        <meshLambertMaterial emissive="#3a1a18" />
      </Instances>
      <Instances items={parts.towers} geometry={boxGeo}>
        <meshLambertMaterial emissive="#3a1a18" />
      </Instances>
      <Instances items={parts.merlons} geometry={boxGeo}>
        <meshLambertMaterial emissive="#3a1a18" />
      </Instances>
    </>
  )
}

/** A few birds gliding across the sunset. */
function Birds() {
  const ref = useRef()
  const birds = useMemo(() => {
    const r = mulberry32(5)
    return Array.from({ length: 7 }, () => ({ x: range(r, -60, 60), y: range(r, 10, 22), z: range(r, -90, -140), speed: range(r, 1.5, 3), phase: r() * 6, size: range(r, 0.5, 0.9) }))
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0.35, 0, 0, 0, 0, 0, 0, 0, 1, 0.35, 0], 3))
    return g
  }, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current?.children.forEach((b, i) => {
      const d = birds[i]
      b.position.set(((d.x + t * d.speed + 80) % 160) - 80, d.y + Math.sin(t * 0.5 + d.phase) * 0.8, d.z)
      b.scale.set(d.size, d.size * (0.6 + 0.6 * Math.abs(Math.sin(t * 4 + d.phase))), 1)
    })
  })
  return (
    <group ref={ref}>
      {birds.map((_, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial color="#3a2030" />
        </lineSegments>
      ))}
    </group>
  )
}

function Minaret(props) {
  const stone = <meshLambertMaterial color="#c47e5e" emissive="#4a2014" />
  return (
    <group {...props}>
      <mesh position-y={9.5}>
        <boxGeometry args={[2.3, 19, 2.3]} />
        {stone}
      </mesh>
      <mesh position-y={19.1}>
        <boxGeometry args={[2.5, 0.3, 2.5]} />
        {stone}
      </mesh>
      <mesh position-y={20}>
        <boxGeometry args={[1.25, 1.8, 1.25]} />
        {stone}
      </mesh>
      <mesh position-y={21.2} rotation-y={Math.PI / 4}>
        <coneGeometry args={[0.95, 0.6, 4]} />
        {stone}
      </mesh>
      {[21.7, 22.05, 22.35].map((y, i) => (
        <mesh key={y} position-y={y}>
          <sphereGeometry args={[0.16 - i * 0.03, 10, 10]} />
          <meshBasicMaterial color={[1.6, 1.2, 0.5]} toneMapped={false} />
        </mesh>
      ))}
      {/* carved window panels and a glowing balcony band */}
      {[8.5, 12, 15.5].map((y) => (
        <mesh key={y} position={[0, y, 1.16]}>
          <planeGeometry args={[0.35, 0.8]} />
          <meshBasicMaterial color="#3a1a14" />
        </mesh>
      ))}
      <mesh position={[0, 17.8, 1.17]}>
        <planeGeometry args={[1.9, 0.18]} />
        <meshBasicMaterial color={[1.9, 1.2, 0.5]} toneMapped={false} />
      </mesh>
    </group>
  )
}
