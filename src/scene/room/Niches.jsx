import { useMemo } from 'react'
import * as THREE from 'three'
import { archBandShape, archPoints, archShape, archTubeGeometry, crestAroundArch, normalizeUVs, rectWithArchNotch } from '../../three/geometry'
import { glowTexture, potTexture, repeated, rosetteTexture } from '../../three/textures'
import { EXPERIENCE } from '../../config/content'
import Interactive from '../Interactive'
import { BACK_Z } from './Architecture'
import { BookRow, BookStack } from './Books'
import { CarvedPanel, CarvedShape } from './Carved'
import { Fanoos } from './Lanterns'
import { BRASS, BRONZE, GlowMaterial, PALETTE, WoodMaterial } from './materials'
import { Ivy } from './Plants'

const V = (x, y) => new THREE.Vector2(x, y)

/* ---------------------------------------------------------------- shared parts */
function GlowBack({ arch, strength = 1.25, z = 0.004 }) {
  const geo = useMemo(() => normalizeUVs(new THREE.ShapeGeometry(archShape(arch), 24)), [arch])
  return (
    <mesh geometry={geo} position-z={z}>
      <meshBasicMaterial map={glowTexture()} color={[strength, strength, strength]} toneMapped={false} />
    </mesh>
  )
}

function ArchLED({ arch, z, strength = 2.4 }) {
  const geo = useMemo(() => archTubeGeometry(arch, 0.011), [arch])
  return (
    <mesh geometry={geo} position-z={z}>
      <GlowMaterial strength={strength} />
    </mesh>
  )
}

/** Shelf board with an LED strip under its front edge. */
function Shelf({ y, width, depth = 0.3, led = true, x = 0 }) {
  return (
    <group position={[x, y, 0]}>
      <mesh position-z={depth / 2}>
        <boxGeometry args={[width, 0.04, depth]} />
        <WoodMaterial color={PALETTE.walnut} repeat={2} roughness={0.35} />
      </mesh>
      {led && (
        <mesh position={[0, -0.026, depth - 0.035]}>
          <boxGeometry args={[width * 0.94, 0.01, 0.014]} />
          <GlowMaterial strength={2.6} />
        </mesh>
      )}
    </group>
  )
}

/** Solid frame = outline minus opening, extruded. */
function Frame({ outer, opening, depth, color = PALETTE.walnut }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape(outer)
    s.holes = [new THREE.Path(opening)]
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 24 })
  }, [outer, opening, depth])
  return (
    <mesh geometry={geo}>
      <WoodMaterial color={color} repeat={1.2} />
    </mesh>
  )
}

/** Carved relief over a dark recess (holes read as depth). */
function Relief({ outer, exclude, z, cell = 0.11 }) {
  const recess = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape(outer)), [outer])
  return (
    <group position-z={z}>
      <mesh geometry={recess}>
        <meshStandardMaterial color="#2b1408" roughness={0.9} />
      </mesh>
      <CarvedShape outer={outer} exclude={exclude} cell={cell} depth={0.018} position-z={0.001}>
        <WoodMaterial color={PALETTE.walnut} repeat={2} />
      </CarvedShape>
    </group>
  )
}

/* ---------------------------------------------------------------- props on shelves */
export function Globe(props) {
  return (
    <group {...props}>
      <mesh position-y={0.26}>
        <sphereGeometry args={[0.16, 40, 28]} />
        <meshStandardMaterial color="#4a2a16" metalness={0.65} roughness={0.42} />
      </mesh>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position-y={0.26} rotation={[0, r, 0.41]}>
          <torusGeometry args={[0.165, 0.004, 6, 48]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
      <mesh position-y={0.26} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.162, 0.003, 6, 48]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position-y={0.26} rotation-z={0.41}>
        <torusGeometry args={[0.185, 0.008, 8, 48, Math.PI * 1.2]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position-y={0.06}>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position-y={0.015}>
        <cylinderGeometry args={[0.05, 0.085, 0.03, 24]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
    </group>
  )
}

function lathe(profile, seg = 40) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg)
}

/** Glazed ceramic pot (round body, short neck, lip). */
export function CeramicPot({ scale = 1, color = '#6a2a14', ...props }) {
  const geo = useMemo(() => lathe([[0, 0], [0.06, 0], [0.11, 0.04], [0.135, 0.11], [0.12, 0.18], [0.07, 0.23], [0.055, 0.26], [0.07, 0.285], [0.062, 0.29], [0, 0.29]]), [])
  return (
    <mesh geometry={geo} scale={scale} {...props}>
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.05} />
    </mesh>
  )
}

function PlantPot({ r = 0.12, h = 0.18, ...props }) {
  return (
    <mesh position-y={h / 2} {...props}>
      <cylinderGeometry args={[r, r * 0.78, h, 24]} />
      <meshStandardMaterial color="#d9c8a8" roughness={0.6} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- left niche (About) */
const LEFT = {
  outer: [V(-1.02, 0.5), V(1.02, 0.5), V(1.02, 4.2), V(0.62, 4.42), V(0.32, 4.72), V(0, 4.86), V(-0.32, 4.72), V(-0.62, 4.42), V(-1.02, 4.2)],
  opening: { width: 1.58, spring: 3.35, rise: 0.82, base: 0.56 },
}

export function LeftNiche() {
  const openingPts = useMemo(() => archPoints(LEFT.opening), [])
  const crestOuter = useMemo(
    () =>
      crestAroundArch({
        bottom: 3.25,
        halfWidth: 0.96,
        arch: { ...LEFT.opening, width: LEFT.opening.width + 0.12, rise: LEFT.opening.rise + 0.08 },
        topPts: [V(0.96, 4.16), V(0.6, 4.36), V(0.3, 4.64), V(0, 4.77), V(-0.3, 4.64), V(-0.6, 4.36), V(-0.96, 4.16)],
      }),
    [],
  )
  const depth = 0.32
  return (
    <group position={[-4.67, 0, BACK_Z]}>
      <GlowBack arch={LEFT.opening} />
      <Frame outer={LEFT.outer} opening={openingPts} depth={depth} />
      <Relief outer={crestOuter} z={depth + 0.012} />
      <ArchLED arch={{ ...LEFT.opening, width: LEFT.opening.width - 0.05, rise: LEFT.opening.rise - 0.03 }} z={depth - 0.04} />

      <Shelf y={0.8} width={1.58} />
      <Shelf y={1.88} width={1.58} />
      <Shelf y={2.98} width={1.58} />

      {/* top shelf: pothos in a pot + globe */}
      <PlantPot position={[-0.45, 3.0, 0.15]} />
      <Ivy position={[-0.45, 3.24, 0.15]} strands={10} length={[0.9, 2.2]} spread={0.36} leafSize={0.1} seed={2} front={0.22} />
      <Interactive id="about-globe" area="about" offset={[0.25, 0.1, 1.2]} position={[0.18, 3.0, 0.15]}>
        <Globe />
      </Interactive>

      {/* middle shelf: books (one clickable) */}
      <BookRow position={[-0.12, 1.9, 0.03]} width={0.78} height={[0.38, 0.48]} depth={0.24} seed={4} area="about" features={[{ id: 'about', color: '#e6d3b0', w: 0.07, h: 0.47 }]} />

      {/* bottom shelf: ceramic pot + lantern */}
      <CeramicPot position={[-0.42, 0.82, 0.15]} scale={1.15} />
      <Fanoos position={[0.4, 0.82, 0.15]} size={0.22} height={0.3} light={false} seed={5} />

      <pointLight position={[0, 2.6, 0.7]} color="#ff9a3c" intensity={4} distance={3.5} decay={2} />
    </group>
  )
}

/* ---------------------------------------------------------------- right wall (Experience) */
const ARCH_CAB = {
  width: 1.62,
  bottom: 1.58,
  top: 4.55,
  opening: { width: 1.28, spring: 3.62, rise: 0.62, base: 1.64 },
}

function SideShelf(props) {
  const w = 0.56
  const h = 1.75
  const outer = useMemo(() => [V(-w / 2, 0), V(w / 2, 0), V(w / 2, h), V(-w / 2, h)], [])
  const opening = useMemo(() => [V(-w / 2 + 0.05, 0.05), V(w / 2 - 0.05, 0.05), V(w / 2 - 0.05, h - 0.05), V(-w / 2 + 0.05, h - 0.05)], [])
  return (
    <group {...props}>
      <mesh position={[0, h / 2, 0.004]}>
        <planeGeometry args={[w - 0.1, h - 0.1]} />
        <meshBasicMaterial map={glowTexture()} color={[0.95, 0.95, 0.95]} toneMapped={false} />
      </mesh>
      <Frame outer={outer} opening={opening} depth={0.28} />
      <Shelf y={0.42} width={w - 0.1} depth={0.27} />
      <Shelf y={0.98} width={w - 0.1} depth={0.27} />
      <Shelf y={h - 0.06} width={w} depth={0.3} led={false} />
      {/* camera (bottom) */}
      <group position={[0.02, 0.135, 0.14]}>
        <mesh>
          <boxGeometry args={[0.2, 0.12, 0.09]} />
          <meshStandardMaterial color="#18181a" roughness={0.45} />
        </mesh>
        <mesh position={[0.02, 0, 0.065]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.042, 0.046, 0.06, 20]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.02, 0, 0.096]}>
          <circleGeometry args={[0.03, 20]} />
          <meshStandardMaterial color="#0a0a14" metalness={0.9} roughness={0.05} />
        </mesh>
      </group>
      {/* books (middle) */}
      <BookRow position={[-0.22, 0.44, 0.02]} width={0.42} height={[0.26, 0.34]} depth={0.22} seed={21} />
      {/* plant (top) */}
      <PlantPot position={[0.04, 1.0, 0.13]} r={0.09} h={0.13} />
      <Ivy position={[0.04, 1.17, 0.14]} strands={6} length={[0.3, 0.7]} spread={0.14} leafSize={0.08} crown={16} seed={9} front={0.19} />
      <mesh position={[0.06, h - 0.04 + 0.07, 0.14]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 16]} />
        <meshStandardMaterial color="#6a3a22" roughness={0.5} />
      </mesh>
    </group>
  )
}

function ArchedCabinet(props) {
  const { width, bottom, top, opening } = ARCH_CAB
  const outer = useMemo(() => [V(-width / 2, bottom), V(width / 2, bottom), V(width / 2, top), V(-width / 2, top)], [])
  const openingPts = useMemo(() => archPoints(opening), [])
  const spandrels = useMemo(() => {
    const hw = width / 2 - 0.06
    return crestAroundArch({ bottom: 3.5, halfWidth: hw, arch: { ...opening, width: opening.width + 0.12, rise: opening.rise + 0.06 }, topPts: [V(hw, top - 0.06), V(-hw, top - 0.06)] })
  }, [])
  const plateTex = useMemo(() => repeated(potTexture(), 1), [])
  const depth = 0.32
  // the 3 jobs: taller, thicker books that fly out when clicked
  const experienceBooks = useMemo(() => EXPERIENCE.map((e) => ({ id: e.id, color: e.color, w: 0.085, h: 0.47, fly: true, label: e.company, sub: e.role })), [])
  return (
    <group {...props}>
      <GlowBack arch={opening} />
      <Frame outer={outer} opening={openingPts} depth={depth} />
      <Relief outer={spandrels} z={depth + 0.012} cell={0.1} />
      <ArchLED arch={{ ...opening, width: opening.width - 0.05, rise: opening.rise - 0.03 }} z={depth - 0.04} />
      <Shelf y={2.45} width={opening.width} />
      <Shelf y={3.17} width={opening.width} />

      {/* top shelf: experience books — click one to open that role */}
      <BookRow position={[-0.56, 3.19, 0.04]} width={1.1} height={[0.32, 0.4]} depth={0.24} seed={8} area="experience" features={experienceBooks} />
      {/* middle shelf: small pot + decorative plate */}
      <CeramicPot position={[-0.4, 2.47, 0.14]} scale={0.75} color="#3a2414" />
      <mesh position={[0.25, 2.69, 0.1]} rotation-x={Math.PI / 2 - 0.15}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 40]} />
        <meshStandardMaterial map={plateTex} roughness={0.25} />
      </mesh>
      <Ivy position={[-0.12, 2.6, 0.18]} strands={5} length={[0.4, 0.85]} spread={0.12} leafSize={0.08} crown={14} seed={6} front={0.18} />
      {/* bottom: lantern */}
      <Fanoos position={[0.3, 1.66, 0.15]} size={0.2} height={0.3} light={false} seed={7} />
      <BookStack position={[-0.32, 1.66, 0.16]} count={2} size={[0.3, 0.05, 0.22]} seed={31} />
    </group>
  )
}

/** Carved mashrabiya frame + wooden arch + back-lit zellige infill. */
function MosaicArch(props) {
  const W = 2.74
  const bottom = 1.95
  const top = 5.02
  const arch = { width: 2.2, spring: 3.85, rise: 1.0, base: bottom }
  const outerArch = { width: 2.42, spring: 3.85, rise: 1.12, base: bottom }
  const frameOuter = useMemo(() => rectWithArchNotch({ width: W - 0.08, bottom, top: top - 0.05, arch: outerArch }), [])
  const bandGeo = useMemo(() => new THREE.ExtrudeGeometry(archBandShape(outerArch, arch), { depth: 0.1, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 24 }), [])
  const panelGeo = useMemo(() => normalizeUVs(new THREE.ShapeGeometry(archShape(arch), 24)), [])
  return (
    <group {...props}>
      {/* backlight behind the carved frame */}
      <mesh position={[0, (bottom + top) / 2, 0.005]}>
        <planeGeometry args={[W - 0.04, top - bottom - 0.04]} />
        <meshBasicMaterial map={glowTexture()} color={[1.05, 1.05, 1.05]} toneMapped={false} />
      </mesh>
      <CarvedShape outer={frameOuter} cell={0.14} depth={0.04} position-z={0.03}>
        <WoodMaterial color={PALETTE.walnut} repeat={1.6} />
      </CarvedShape>
      {/* outer rim */}
      {[
        [0, top - 0.03, W, 0.06],
        [-W / 2 + 0.03, (bottom + top) / 2, 0.06, top - bottom],
        [W / 2 - 0.03, (bottom + top) / 2, 0.06, top - bottom],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.06]}>
          <boxGeometry args={[w, h, 0.08]} />
          <WoodMaterial color={PALETTE.walnutDeep} repeat={1.2} />
        </mesh>
      ))}
      {/* smooth wooden arch band + LED */}
      <mesh geometry={bandGeo} position-z={0.03}>
        <WoodMaterial color="#a5602e" repeat={1.4} roughness={0.38} />
      </mesh>
      <ArchLED arch={{ ...arch, width: arch.width - 0.03, rise: arch.rise - 0.02 }} z={0.12} strength={2} />
      {/* zellige infill */}
      <mesh geometry={panelGeo} position-z={0.02}>
        <meshStandardMaterial map={rosetteTexture()} emissiveMap={rosetteTexture()} emissive="#ffe0b0" emissiveIntensity={0.55} bumpMap={rosetteTexture()} bumpScale={1.2} roughness={0.22} />
      </mesh>
      <pointLight position={[0, 3.4, 0.9]} color="#ffb070" intensity={3} distance={3.5} decay={2} />
    </group>
  )
}

/** The whole right wall: side shelf, arched shelf, zellige arch, base ledge. */
export function RightWall() {
  return (
    <group position={[0, 0, BACK_Z]}>
      <SideShelf position={[2.7, 1.62, 0]} />
      <ArchedCabinet position={[3.82, 0, 0]} />
      <MosaicArch position={[6.31, 0, 0]} />
      {/* base ledge under the zellige arch */}
      <mesh position={[6.12, 1.91, 0.2]}>
        <boxGeometry args={[2.95, 0.07, 0.42]} />
        <WoodMaterial color={PALETTE.walnut} repeat={1} />
      </mesh>
      <pointLight position={[3.6, 2.9, 0.7]} color="#ff9a3c" intensity={3.5} distance={3} decay={2} />
    </group>
  )
}

/** Trailing plant hanging on the wall between the arch and the shelves. */
export function WallIvy() {
  return (
    <group position={[2.27, 4.55, BACK_Z + 0.12]}>
      <mesh position-y={0.05}>
        <cylinderGeometry args={[0.14, 0.11, 0.2, 16]} />
        <meshStandardMaterial color="#5a3420" roughness={0.5} />
      </mesh>
      <Ivy strands={12} length={[1.2, 2.5]} spread={0.5} leafSize={0.11} crown={34} seed={17} front={0.26} />
    </group>
  )
}

export { CarvedPanel }
