import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { furMaterial } from '../../three/fur'
import { playCatSound } from '../../audio/meow'
import * as THREE from 'three'
import { leatherBump, repeated, rugTexture } from '../../three/textures'
import { LeatherMaterial, PALETTE } from './materials'

export function Rug(props) {
  const bump = useMemo(() => repeated(leatherBump(), 8, 5), [])
  return (
    <mesh rotation-x={-Math.PI / 2} {...props}>
      <planeGeometry args={[7.4, 4.6]} />
      <meshStandardMaterial map={rugTexture()} bumpMap={bump} bumpScale={2} roughness={0.95} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- Pouf */
const GORES = 12
const POUF_PROFILE = [[0, 0], [0.4, 0], [0.53, 0.05], [0.59, 0.17], [0.6, 0.27], [0.56, 0.38], [0.46, 0.47], [0.3, 0.52], [0.12, 0.535], [0, 0.54]]

const seamFactor = (theta) => {
  const step = (Math.PI * 2) / GORES
  const d = Math.abs(((theta % step) + step) % step - step / 2) - step / 2
  return Math.exp(-((d / 0.07) ** 2))
}

function useProfileCurve(theta, inset = 0) {
  return useMemo(() => {
    const pts = POUF_PROFILE.slice(1, -1).map(([r, y]) => {
      const rr = r * (1 - 0.04) + inset
      return new THREE.Vector3(Math.sin(theta) * rr, y, Math.cos(theta) * rr)
    })
    return new THREE.CatmullRomCurve3(pts)
  }, [theta, inset])
}

function Seam({ theta }) {
  const curve = useProfileCurve(theta, 0.006)
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.005, 6), [curve])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={PALETTE.stitch} roughness={0.8} />
    </mesh>
  )
}

/** Moroccan leather pouf: 12 padded gores, piped seams, star-stitched top. */
export function Pouf(props) {
  const geo = useMemo(() => {
    const g = new THREE.LatheGeometry(POUF_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 120)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const z = p.getZ(i)
      const theta = Math.atan2(x, z)
      const k = 1 - 0.045 * seamFactor(theta)
      p.setX(i, x * k)
      p.setZ(i, z * k)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const seams = useMemo(() => Array.from({ length: GORES }, (_, i) => (i * Math.PI * 2) / GORES), [])
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <LeatherMaterial color="#7e3a1a" repeat={3} roughness={0.42} />
      </mesh>
      {seams.map((t) => (
        <Seam key={t} theta={t} />
      ))}
      {/* top star stitching */}
      <mesh position-y={0.538} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.13, 0.005, 6, 40]} />
        <meshStandardMaterial color={PALETTE.stitch} />
      </mesh>
      {seams.map((t) => (
        <mesh key={t} position={[Math.sin(t) * 0.07, 0.541, Math.cos(t) * 0.07]} rotation={[Math.PI / 2, 0, -t]}>
          <boxGeometry args={[0.008, 0.11, 0.004]} />
          <meshStandardMaterial color={PALETTE.stitch} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------- Cat */
const WHITE = new THREE.Color('#f4ede3')
const GINGER = new THREE.Color('#d9822b')
const STRIPE = new THREE.Color('#9c4d14')
const PINK = '#e9a1a1'
const smooth = THREE.MathUtils.smoothstep

/** Paint a vertex-colour coat: fn(colorOut, x, y, z, u, v). */
function paint(geo, fn) {
  const p = geo.attributes.position
  const uv = geo.attributes.uv
  const c = new THREE.Color()
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    fn(c, p.getX(i), p.getY(i), p.getZ(i), uv.getX(i), uv.getY(i))
    col.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geo
}

/** Ginger tabby with soft dark stripes. */
const tabby = (c, t, amount = 0.65) => c.lerpColors(GINGER, STRIPE, smooth(0.5 + 0.5 * Math.sin(t), 0.55, 0.95) * amount)

function catGeometries() {
  // body: curled loaf, ginger back, white belly
  const body = paint(new THREE.SphereGeometry(1, 48, 32), (c, x, y, z) => {
    const back = smooth(y * 0.9 + 0.3 * Math.sin(4 * x + 1) - 0.25 * z, -0.05, 0.18)
    tabby(c, x * 15 + 2 * Math.sin(z * 4))
    c.lerpColors(WHITE, c.clone(), back)
  }).scale(0.17, 0.09, 0.115)

  const haunch = paint(new THREE.SphereGeometry(1, 32, 24), (c, x, y, z) => {
    tabby(c, y * 12 + z * 6)
    c.lerpColors(WHITE, c.clone(), smooth(y + 0.3, 0, 0.5))
  }).scale(0.085, 0.075, 0.09)

  // head: ginger cap with "M" stripes, white muzzle and chin
  const head = paint(new THREE.SphereGeometry(1, 40, 28), (c, x, y, z) => {
    const cap = smooth(Math.max(y - (0.18 - 0.4 * Math.abs(x)), -(z + 0.3)), -0.05, 0.12)
    tabby(c, x * 20, y > 0.45 ? 0.7 : 0.25)
    c.lerpColors(WHITE, c.clone(), cap)
  }).scale(0.075, 0.064, 0.07)

  // muzzle puffs (two merged spheres)
  const puff = (sx) => paint(new THREE.SphereGeometry(1, 20, 14), (c) => c.copy(WHITE)).scale(0.021, 0.018, 0.019).translate(sx * 0.016, -0.026, 0.056)
  const muzzle = mergeGeometries([puff(-1), puff(1)])

  // tail: tapered, wraps around the body, striped with a white tip
  const pivot = new THREE.Vector3(0.15, 0.03, -0.05)
  const curve = new THREE.CatmullRomCurve3(
    [
      [0.15, 0.03, -0.05],
      [0.2, 0.024, 0.06],
      [0.1, 0.022, 0.135],
      [-0.03, 0.025, 0.145],
      [-0.1, 0.03, 0.12],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z).sub(pivot)),
  )
  const tail = new THREE.TubeGeometry(curve, 48, 0.026, 14)
  {
    // taper toward the tip
    const p = tail.attributes.position
    const uv = tail.attributes.uv
    const onCurve = new THREE.Vector3()
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      const u = uv.getX(i)
      curve.getPointAt(Math.min(1, u), onCurve)
      v.fromBufferAttribute(p, i).sub(onCurve).multiplyScalar(1 - 0.45 * u).add(onCurve)
      p.setXYZ(i, v.x, v.y, v.z)
    }
    tail.computeVertexNormals()
  }
  paint(tail, (c, x, y, z, u) => {
    tabby(c, u * 42, 0.75)
    if (u > 0.86) c.lerp(WHITE, smooth(u, 0.86, 0.92))
  })

  const paw = paint(new THREE.SphereGeometry(1, 20, 14), (c) => c.copy(WHITE)).scale(0.03, 0.018, 0.026)
  return { body, haunch, head, muzzle, tail, pivot, paw }
}

/** Skin + fur shells for one body part. */
function Furry({ geometry, layers = 14, length = 0.012, density, gravity }) {
  const mats = useMemo(() => Array.from({ length: layers + 1 }, (_, i) => furMaterial({ layer: i / layers, length, density, gravity })), [layers, length, density, gravity])
  return mats.map((m, i) => <mesh key={i} geometry={geometry} material={m} castShadow={i === 0} receiveShadow={i === 0} userData={{ noShadow: i > 0 }} />)
}

const BODY_FUR = [420, 170]
const HEAD_FUR = [240, 110]
const TAIL_FUR = [190, 60]
const SMALL_FUR = [120, 60]

/* --- floating hearts ---------------------------------------------------- */
const heartGeo = (() => {
  const s = new THREE.Shape()
  s.moveTo(0, -0.5)
  s.bezierCurveTo(-0.1, -0.35, -0.6, -0.1, -0.5, 0.2)
  s.bezierCurveTo(-0.42, 0.5, -0.08, 0.54, 0, 0.26)
  s.bezierCurveTo(0.08, 0.54, 0.42, 0.5, 0.5, 0.2)
  s.bezierCurveTo(0.6, -0.1, 0.1, -0.35, 0, -0.5)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4, curveSegments: 16 })
  g.center()
  return g
})()
const MAX_HEARTS = 32
const PET = import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('pet')

/** Hearts rise from the cat, sway, and pop away. `api.current.burst()` spawns a few. */
function Hearts({ api, origin }) {
  const ref = useRef()
  const hearts = useRef([])
  const camera = useThree((s) => s.camera)
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), pq: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), [])
  const clock = useThree((s) => s.clock)

  api.current = {
    burst(n = 7) {
      const now = clock.elapsedTime
      for (let i = 0; i < n; i++) {
        hearts.current.push({
          born: now + i * 0.13,
          x: origin[0] + (Math.random() - 0.5) * 0.08,
          z: origin[2] + (Math.random() - 0.5) * 0.06,
          sway: 0.6 + Math.random() * 0.8,
          phase: Math.random() * 6,
          size: 0.03 + Math.random() * 0.025,
          rise: 0.32 + Math.random() * 0.18,
        })
      }
      hearts.current = hearts.current.slice(-MAX_HEARTS)
    },
  }

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const now = clock.elapsedTime
    // face the camera: parent world rotationâ»Â¹ Ã— camera rotation
    mesh.parent.getWorldQuaternion(tmp.pq).invert()
    tmp.q.copy(tmp.pq).multiply(camera.quaternion)
    hearts.current = PET ? hearts.current.slice(-8) : hearts.current.filter((h) => now - h.born < 2.4)
    let n = 0
    for (const h of hearts.current) {
      // dev ?pet: frozen staggered ages, so a screenshot can show them mid-flight
      const a = PET ? 0.25 + (n % 8) * 0.24 : now - h.born
      if (a < 0) continue
      const t = a / 2.4
      const pop = Math.min(1, a / 0.18) * (1 - smooth(t, 0.75, 1)) // grow in, shrink out
      tmp.p.set(h.x + Math.sin(a * 3 * h.sway + h.phase) * 0.035, origin[1] + t * h.rise * 1.6, h.z)
      tmp.s.setScalar(h.size * pop * (1 + 0.08 * Math.sin(a * 12)))
      mesh.setMatrixAt(n++, tmp.m.compose(tmp.p, tmp.q, tmp.s))
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[heartGeo, undefined, MAX_HEARTS]} count={0} frustumCulled={false} userData={{ noShadow: true }}>
      <meshStandardMaterial color="#ff5d8f" emissive="#ff2f6d" emissiveIntensity={1.4} roughness={0.35} toneMapped={false} />
    </instancedMesh>
  )
}

/** Whiskers: three per side, fanning out from the muzzle. */
function Whiskers() {
  const geo = useMemo(() => {
    const pts = []
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const y = -0.024 - k * 0.006
        pts.push(s * 0.026, y, 0.062, s * 0.1, y + 0.012 - k * 0.014, 0.05 - k * 0.006)
      }
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  }, [])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#fffaf2" transparent opacity={0.75} />
    </lineSegments>
  )
}

/**
 * Sleeping orange-and-white tabby. Click it: it meows and purrs, lifts its
 * head with happy closed eyes, swishes its tail, and hearts float up.
 */
function Cat(props) {
  const geos = useMemo(catGeometries, [])
  const bodyRef = useRef()
  const headRef = useRef()
  const tailRef = useRef()
  const earsRef = useRef([])
  const eyesRef = useRef([])
  const hearts = useRef()
  const reactAt = useRef(-10)
  const clock = useThree((s) => s.clock)

  useFrame(() => {
    const t = clock.elapsedTime
    const e = t - reactAt.current
    const k = e < 2.6 ? Math.sin(Math.min(1, e / 0.3) * Math.PI * 0.5) * (1 - smooth(e, 1.8, 2.6)) : 0
    if (bodyRef.current) bodyRef.current.scale.y = 1 + Math.sin(t * 1.4) * 0.03 + k * 0.04
    if (headRef.current) {
      headRef.current.rotation.x = 0.1 - k * 0.32
      headRef.current.position.y = 0.075 + k * 0.03
    }
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 0.6) * 0.06 + k * Math.sin(e * 8) * 0.35
    earsRef.current.forEach((ear, i) => {
      if (ear) ear.rotation.x = e < 0.7 ? Math.sin(e * 34 + i) * 0.25 * (1 - e / 0.7) : 0
    })
    // happy "^ ^" closed eyes while it purrs, sleepy "â€¿ â€¿" otherwise
    eyesRef.current.forEach((eye) => eye && (eye.rotation.z = k > 0.25 ? 0 : Math.PI))
  })

  // dev only: ?pet keeps petting the cat (to check hearts + reaction without clicking)
  useEffect(() => {
    if (!import.meta.env.DEV || !window.location.search.includes('pet')) return
    const id = setInterval(() => {
      reactAt.current = clock.elapsedTime
      hearts.current?.burst(8)
    }, 1000)
    return () => clearInterval(id)
  }, [clock])

  const onClick = (e) => {
    e.stopPropagation()
    reactAt.current = clock.elapsedTime
    hearts.current?.burst(8)
    playCatSound()
  }

  return (
    <group {...props}>
      {/* generous invisible click target */}
      <mesh
        position-y={0.08}
        scale={[0.24, 0.16, 0.19]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        userData={{ noShadow: true }}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <group ref={bodyRef} position-y={0.08}>
        <Furry geometry={geos.body} density={BODY_FUR} length={0.013} />
      </group>
      <group position={[0.085, 0.085, -0.025]}>
        <Furry geometry={geos.haunch} density={SMALL_FUR} length={0.011} layers={10} />
      </group>
      <group ref={tailRef} position={geos.pivot}>
        <Furry geometry={geos.tail} density={TAIL_FUR} length={0.011} layers={10} gravity={0.1} />
      </group>
      {[-0.13, -0.075].map((x) => (
        <group key={x} position={[x, 0.018, 0.088]}>
          <Furry geometry={geos.paw} density={SMALL_FUR} length={0.006} layers={6} />
        </group>
      ))}

      {/* head resting on the paws, face toward the room */}
      <group position={[-0.16, 0.075, 0.05]} rotation={[0, -0.55, 0.12]}>
        <group ref={headRef}>
          <Furry geometry={geos.head} density={HEAD_FUR} length={0.008} layers={12} />
          <Furry geometry={geos.muzzle} density={SMALL_FUR} length={0.004} layers={6} />
          {[-1, 1].map((s, i) => (
            <group key={s} ref={(el) => (earsRef.current[i] = el)} position={[s * 0.04, 0.052, -0.012]} rotation-z={-s * 0.32}>
              <mesh scale={[1, 1, 0.45]} castShadow>
                <coneGeometry args={[0.027, 0.056, 16]} />
                <meshStandardMaterial color={GINGER} roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.004, 0.009]} scale={[0.62, 0.72, 0.2]}>
                <coneGeometry args={[0.027, 0.056, 16]} />
                <meshStandardMaterial color={PINK} roughness={0.8} />
              </mesh>
            </group>
          ))}
          {/* closed eyes */}
          {[-1, 1].map((s, i) => (
            <mesh key={s} ref={(el) => (eyesRef.current[i] = el)} position={[s * 0.027, 0.012, 0.066]} rotation-z={Math.PI}>
              <torusGeometry args={[0.011, 0.0024, 6, 14, Math.PI]} />
              <meshStandardMaterial color="#2e1a10" roughness={0.6} />
            </mesh>
          ))}
          {/* nose */}
          <mesh position={[0, -0.012, 0.073]} rotation-x={0.4} scale={[1.3, 0.8, 0.8]}>
            <sphereGeometry args={[0.0065, 10, 8]} />
            <meshStandardMaterial color={PINK} roughness={0.4} />
          </mesh>
          <Whiskers />
        </group>
      </group>

      <Hearts api={hearts} origin={[-0.15, 0.17, 0.05]} />
    </group>
  )
}

/** Leather pouf with the sleeping cat on top. */
export function PoufWithCat(props) {
  return (
    <group {...props}>
      <Pouf />
      <Cat position={[0, 0.54, 0]} rotation-y={-0.2} scale={1.25} />
    </group>
  )
}
