import { useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { wallWithArchShape } from '../../three/geometry'
import { floorTexture, plasterBump, repeated, tileBandTexture, wallTexture } from '../../three/textures'
import { GlowStrip } from './props'
import { CarvedPanel } from './Carved'
import { PALETTE, WoodMaterial } from './materials'
import { useRoomStore } from '../../store/useRoomStore'

export const BACK_Z = -4.5
export const DOOR = { cx: -0.56, width: 3.9, spring: 3.9, rise: 1.6 }
const ROOM_W = 18
const ROOM_H = 7
const BAND_H = 0.38

export function WallMaterial({ repeat = 0.35 }) {
  const tex = useMemo(() => repeated(wallTexture(), repeat), [repeat])
  const bump = useMemo(() => repeated(plasterBump(), repeat * 1.6), [repeat])
  return <meshStandardMaterial map={tex} bumpMap={bump} bumpScale={1.4} roughness={0.85} />
}

function BackWall() {
  const geo = useMemo(() => {
    const shape = wallWithArchShape({ width: ROOM_W, height: ROOM_H, arch: DOOR })
    return new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 24 })
  }, [])
  return (
    <mesh geometry={geo} position={[0, 0, BACK_Z - 0.5]}>
      <WallMaterial />
    </mesh>
  )
}

/** Zellige wainscot along the bottom of the back wall (interrupted by the doorway). */
function TileBand() {
  const segments = useMemo(() => {
    const left = [-ROOM_W / 2, DOOR.cx - DOOR.width / 2]
    const right = [DOOR.cx + DOOR.width / 2, ROOM_W / 2]
    return [left, right].map(([a, b]) => ({ x: (a + b) / 2, w: b - a }))
  }, [])
  return segments.map((s, i) => (
    <mesh key={i} position={[s.x, BAND_H / 2, BACK_Z + 0.005]}>
      <planeGeometry args={[s.w, BAND_H]} />
      <meshStandardMaterial map={repeated(tileBandTexture(), s.w / BAND_H, 1)} roughness={0.3} />
    </mesh>
  ))
}

function Floor() {
  const tex = useMemo(() => repeated(floorTexture(), 9, 6.5), [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 2]}>
      <planeGeometry args={[ROOM_W, 13]} />
      <MeshReflectorMaterial
        map={tex}
        blur={[400, 120]}
        resolution={512}
        mixBlur={1}
        mixStrength={0.9}
        mirror={0.5}
        depthScale={0.6}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        roughness={0.55}
        metalness={0.05}
      />
    </mesh>
  )
}

/** Zellige inlay framing the rug area on the floor. */
function FloorInlay() {
  const tex = (len) => repeated(tileBandTexture(), len / 0.34, 1)
  const strips = [
    { p: [0.6, -3.55], w: 11.8, r: 0 },
    { p: [0.6, 3.2], w: 11.8, r: 0 },
    { p: [-5.3, -0.17], w: 6.8, r: Math.PI / 2 },
    { p: [6.5, -0.17], w: 6.8, r: Math.PI / 2 },
  ]
  return strips.map((s, i) => (
    <mesh key={i} rotation={[-Math.PI / 2, 0, s.r]} position={[s.p[0], 0.004, s.p[1]]}>
      <planeGeometry args={[s.w, 0.34]} />
      <meshStandardMaterial map={tex(s.w)} roughness={0.25} />
    </mesh>
  ))
}

function SideWalls() {
  return (
    <>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROOM_W / 2 - 0.6), ROOM_H / 2, 2]} rotation-y={-side * Math.PI / 2}>
          <planeGeometry args={[13, ROOM_H]} />
          <WallMaterial />
        </mesh>
      ))}
      <mesh position={[0, ROOM_H, 2]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[ROOM_W, 13]} />
        <meshStandardMaterial color="#3a2016" roughness={0.9} />
      </mesh>
    </>
  )
}

/**
 * Moroccan carved window (left edge of the frame): two tall walnut panels with
 * real geometric cut-outs inside an outer frame, warm backlight behind.
 */
function LeftScreen() {
  const H = 5.9
  const pw = 0.6
  // it stands between the camera and the left niche, so step it aside while "About" is focused
  const hidden = useRoomStore((s) => s.activeArea === 'about')
  return (
    <group position={[-5.75, 0, -1.6]} rotation-y={0.62} visible={!hidden}>
      {[-1, 1].map((s) => (
        <CarvedPanel key={s} position={[s * (pw / 2 + 0.03), 0.15 + H / 2, 0]} width={pw} height={H} cell={0.2} depth={0.04} glow={1.3} color={PALETTE.walnut} />
      ))}
      {/* outer frame + centre mullion */}
      {[
        [-0.69, 0.15 + H / 2, 0.1, H + 0.2],
        [0.69, 0.15 + H / 2, 0.1, H + 0.2],
        [0, 0.15 + H / 2, 0.06, H],
        [0, 0.1, 1.48, 0.12],
        [0, 0.15 + H + 0.05, 1.48, 0.12],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.03]}>
          <boxGeometry args={[w, h, 0.12]} />
          <WoodMaterial color={PALETTE.walnutDeep} repeat={1} />
        </mesh>
      ))}
      <pointLight position={[0.4, 2.2, 0.6]} color="#ff9a3c" intensity={4} distance={4} decay={2} />
      <GlowStrip size={[1.3, 0.02, 0.02]} position={[0, 0.17, 0.08]} />
    </group>
  )
}

export default function Architecture() {
  return (
    <group>
      <BackWall />
      <TileBand />
      <Floor />
      <FloorInlay />
      <SideWalls />
      <LeftScreen />
    </group>
  )
}
