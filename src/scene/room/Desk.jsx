import { useLayoutEffect, useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { engravedBump, wallpaperTexture } from '../../three/textures'
import Interactive from '../Interactive'
import { CarvedPanel } from './Carved'
import { Fanoos } from './Lanterns'
import { BookStack } from './Books'
import { BRASS, PALETTE, WoodMaterial } from './materials'
import Steam from './Steam'

const W = 4.03
const D = 1.6
const H = 1.2

// Carved panels on the desk front, as fractions of the front width (from the room image).
const FRONT_PANELS = [
  [0.01, 0.2],
  [0.23, 0.505],
  [0.52, 0.775],
  [0.785, 0.99],
]

/** The carved, back-lit walnut desk and everything on it. Origin: floor under desk centre. */
export default function Desk(props) {
  const panelH = 0.84
  const frontZ = (D - 0.1) / 2
  return (
    <group {...props}>
      {/* top slab with softened edges */}
      <RoundedBox args={[W + 0.2, 0.12, D + 0.16]} radius={0.035} smoothness={4} position-y={H - 0.06}>
        <WoodMaterial color={PALETTE.walnut} repeat={0.6} roughness={0.4} envMapIntensity={1.1} />
      </RoundedBox>
      {/* carcass + plinth */}
      <mesh position-y={(H - 0.18) / 2 + 0.06}>
        <boxGeometry args={[W, H - 0.18, D - 0.1]} />
        <WoodMaterial color={PALETTE.walnutDeep} repeat={0.8} />
      </mesh>
      <mesh position-y={0.05}>
        <boxGeometry args={[W + 0.08, 0.1, D]} />
        <WoodMaterial color={PALETTE.walnutDeep} repeat={0.8} />
      </mesh>

      {/* front: carved panels (real cut-outs) over a warm backlight */}
      {FRONT_PANELS.map(([a, b], i) => {
        const w = (b - a) * W
        const x = -W / 2 + ((a + b) / 2) * W
        return (
          <group key={i} position={[x, 0.58, frontZ + 0.035]}>
            <CarvedPanel width={w} height={panelH} cell={0.2} depth={0.03} color={PALETTE.walnutDeep} glow={1.35} />
          </group>
        )
      })}
      {/* rails & stiles */}
      {[0.13, 1.03].map((y) => (
        <mesh key={y} position={[0, y, frontZ + 0.05]}>
          <boxGeometry args={[W, 0.06, 0.04]} />
          <WoodMaterial color={PALETTE.walnut} repeat={0.8} />
        </mesh>
      ))}
      {[0, 0.215, 0.512, 0.78, 1].map((f) => (
        <mesh key={f} position={[-W / 2 + f * W, 0.58, frontZ + 0.05]}>
          <boxGeometry args={[0.06, panelH + 0.06, 0.045]} />
          <WoodMaterial color={PALETTE.walnut} repeat={0.8} />
        </mesh>
      ))}
      {/* carved panel on the visible left end */}
      <group position={[-W / 2 - 0.035, 0.58, 0]} rotation-y={-Math.PI / 2}>
        <CarvedPanel width={D - 0.4} height={panelH} cell={0.2} depth={0.03} color={PALETTE.walnutDeep} glow={1.2} />
      </group>

      {/* light spill onto the rug */}
      <pointLight position={[0, 0.45, 1.3]} color="#ff8a2a" intensity={5} distance={4.5} decay={2} />

      {/* ---- desk objects (desk-local coordinates) ---- */}
      <BookStack position={[-1.55, H, 0.32]} count={2} size={[0.5, 0.075, 0.34]} seed={41} colors={['#26262a', '#1b2a41']} />
      <Fanoos position={[-1.2, H, 0.48]} size={0.28} intensity={2.2} distance={2.6} seed={9} />
      <Interactive id="projects" area="projects" offset={[0.7, 0.95, 2.1]} position={[-0.1, H, -0.6]}>
        {/* turned toward the robot sitting behind the desk */}
        <MacBook rotation-y={Math.PI + 0.8} />
      </Interactive>
      <TeaSet position={[1.0, H, 0.1]} />
      <BookStack position={[1.58, H, -0.1]} count={3} size={[0.42, 0.06, 0.3]} seed={44} />
    </group>
  )
}

/* ---------------------------------------------------------------- MacBook */
const ALU = { color: '#c0c0c0', metalness: 0.9, roughness: 0.3 }

function appleShape() {
  // simple apple silhouette with a bite and a leaf
  const s = new THREE.Shape()
  s.moveTo(0, 0.38)
  s.bezierCurveTo(0.2, 0.52, 0.48, 0.42, 0.46, 0.1)
  s.bezierCurveTo(0.44, -0.2, 0.3, -0.45, 0.16, -0.46)
  s.bezierCurveTo(0.08, -0.47, 0.04, -0.42, 0, -0.42)
  s.bezierCurveTo(-0.04, -0.42, -0.08, -0.47, -0.16, -0.46)
  s.bezierCurveTo(-0.3, -0.45, -0.46, -0.2, -0.46, 0.1)
  s.bezierCurveTo(-0.46, 0.42, -0.2, 0.52, 0, 0.38)
  const bite = new THREE.Path()
  bite.absarc(0.5, 0.06, 0.15, 0, Math.PI * 2, true)
  s.holes.push(bite)
  const leaf = new THREE.Shape()
  leaf.moveTo(0.02, 0.48)
  leaf.quadraticCurveTo(0.02, 0.72, 0.2, 0.78)
  leaf.quadraticCurveTo(0.22, 0.56, 0.02, 0.48)
  return [s, leaf]
}

function Keyboard({ width, depth }) {
  const ref = useRef()
  const keys = useMemo(() => {
    const out = []
    const cols = 13
    const rows = 5
    const kw = width / cols
    const kd = depth / (rows + 0.6)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === rows - 1 && c > 3 && c < 9) continue
        out.push([-width / 2 + (c + 0.5) * kw, -depth / 2 + (r + 0.5) * kd, kw * 0.82, kd * 0.8])
      }
    }
    out.push([0, -depth / 2 + (rows - 0.5) * kd, kw * 5 * 0.95, kd * 0.8]) // space bar
    return out
  }, [width, depth])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    keys.forEach(([x, z, w, d], i) => ref.current.setMatrixAt(i, m.makeScale(w, 0.004, d).setPosition(x, 0, z)))
    ref.current.instanceMatrix.needsUpdate = true
  }, [keys])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, keys.length]}>
      <boxGeometry />
      <meshStandardMaterial color="#1c1c1e" roughness={0.6} />
    </instancedMesh>
  )
}

/** MacBook-style laptop: base with keyboard + trackpad, hinge, lid with lit display and logo. */
export function MacBook(props) {
  const [apple, leaf] = useMemo(appleShape, [])
  const bw = 0.62
  const bd = 0.43
  return (
    <group {...props}>
      <RoundedBox args={[bw, 0.018, bd]} radius={0.008} smoothness={3} position-y={0.009}>
        <meshStandardMaterial {...ALU} />
      </RoundedBox>
      <mesh position={[0, 0.0185, -0.035]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[bw * 0.9, bd * 0.48]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.7} />
      </mesh>
      <group position={[0, 0.021, -0.035]}>
        <Keyboard width={bw * 0.86} depth={bd * 0.44} />
      </group>
      <mesh position={[0, 0.0186, 0.13]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial color="#b4b4b8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* hinge + lid (opened ~110°) */}
      <mesh position={[0, 0.02, -bd / 2]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.008, 0.008, bw * 0.8, 10]} />
        <meshStandardMaterial color="#2a2a2c" metalness={0.6} roughness={0.4} />
      </mesh>
      <group position={[0, 0.02, -bd / 2]} rotation-x={-0.32}>
        <RoundedBox args={[bw, 0.4, 0.008]} radius={0.004} smoothness={2} position={[0, 0.2, 0]}>
          <meshStandardMaterial {...ALU} />
        </RoundedBox>
        <mesh position={[0, 0.2, 0.0045]}>
          <planeGeometry args={[bw * 0.97, 0.385]} />
          <meshStandardMaterial color="#050505" roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.205, 0.005]}>
          <planeGeometry args={[bw * 0.92, 0.35]} />
          <meshBasicMaterial map={wallpaperTexture()} color={[1.15, 1.15, 1.15]} toneMapped={false} />
        </mesh>
        {/* illuminated logo on the lid back */}
        <group position={[0, 0.22, -0.0045]} rotation-y={Math.PI} scale={0.06}>
          <mesh>
            <shapeGeometry args={[apple, 12]} />
            <meshBasicMaterial color={[1.8, 1.8, 1.8]} toneMapped={false} />
          </mesh>
          <mesh>
            <shapeGeometry args={[leaf, 8]} />
            <meshBasicMaterial color={[1.8, 1.8, 1.8]} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/* ---------------------------------------------------------------- Moroccan tea set */
function lathe(profile, seg = 40) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg)
}

const SILVER = { color: '#d8d8dc', metalness: 1, roughness: 0.18 }

function Teapot(props) {
  const body = useMemo(() => lathe([[0, 0], [0.05, 0], [0.055, 0.012], [0.1, 0.05], [0.118, 0.1], [0.105, 0.15], [0.065, 0.185], [0.05, 0.2], [0.058, 0.205], [0.058, 0.215], [0, 0.215]]), [])
  const lid = useMemo(() => lathe([[0, 0], [0.052, 0], [0.045, 0.03], [0.022, 0.06], [0.014, 0.09], [0.022, 0.1], [0.006, 0.13], [0, 0.135]], 24), [])
  const spout = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.09, 0.05, 0), new THREE.Vector3(0.15, 0.08, 0), new THREE.Vector3(0.19, 0.16, 0), new THREE.Vector3(0.22, 0.22, 0), new THREE.Vector3(0.25, 0.235, 0)])
    return new THREE.TubeGeometry(curve, 24, 0.014, 10)
  }, [])
  const handle = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.1, 0.16, 0), new THREE.Vector3(-0.17, 0.18, 0), new THREE.Vector3(-0.19, 0.1, 0), new THREE.Vector3(-0.115, 0.05, 0)])
    return new THREE.TubeGeometry(curve, 20, 0.011, 8)
  }, [])
  return (
    <group {...props}>
      <mesh geometry={body}>
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh geometry={lid} position-y={0.215}>
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh geometry={spout}>
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh geometry={handle}>
        <meshStandardMaterial color="#2a1a10" roughness={0.5} />
      </mesh>
    </group>
  )
}

function TeaGlass(props) {
  const glass = useMemo(() => lathe([[0, 0], [0.034, 0], [0.036, 0.01], [0.031, 0.05], [0.04, 0.115], [0.0395, 0.115], [0.0295, 0.05], [0.0335, 0.012], [0, 0.012]], 28), [])
  const tea = useMemo(() => lathe([[0, 0.012], [0.033, 0.012], [0.029, 0.05], [0.036, 0.09], [0, 0.09]], 24), [])
  return (
    <group {...props}>
      <mesh geometry={tea}>
        <meshStandardMaterial color="#b4430e" emissive="#5a1a04" emissiveIntensity={0.5} roughness={0.05} />
      </mesh>
      <mesh geometry={glass}>
        <meshStandardMaterial color="#fff4e0" transparent opacity={0.28} roughness={0.05} metalness={0.1} depthWrite={false} />
      </mesh>
      {[0.07, 0.1].map((y) => (
        <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.035 + (y - 0.05) * 0.12, 0.0025, 6, 28]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
    </group>
  )
}

/** Engraved round silver tray with teapot and tea glasses. */
function TeaSet(props) {
  const bump = engravedBump()
  return (
    <group {...props}>
      <mesh position-y={0.014}>
        <cylinderGeometry args={[0.36, 0.33, 0.012, 48]} />
        <meshStandardMaterial {...SILVER} bumpMap={bump} bumpScale={2} />
      </mesh>
      <mesh position-y={0.022} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.36, 0.012, 8, 64]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3
        return (
          <mesh key={i} position={[Math.cos(a) * 0.25, 0.004, Math.sin(a) * 0.25]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial {...SILVER} />
          </mesh>
        )
      })}
      <Teapot position={[0.05, 0.02, -0.03]} rotation-y={0.5} />
      <TeaGlass position={[-0.2, 0.02, 0.1]} />
      <TeaGlass position={[0.22, 0.02, 0.17]} />
      {/* hot mint tea: a thin wisp from the spout, softer steam over each glass */}
      <Steam position={[0.27, 0.26, -0.15]} count={14} rise={0.26} width={0.018} size={0.035} life={2.6} opacity={0.16} />
      <Steam position={[-0.2, 0.12, 0.1]} count={18} rise={0.34} width={0.026} size={0.045} life={3.4} opacity={0.17} />
      <Steam position={[0.22, 0.12, 0.17]} count={18} rise={0.32} width={0.026} size={0.045} life={3.6} opacity={0.17} />
    </group>
  )
}
