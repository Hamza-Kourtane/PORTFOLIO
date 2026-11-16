import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { archBandShape, archPoints, rectWithArchNotch } from '../../three/geometry'
import { scallopedArch } from '../../three/carve'
import { latticeGlowTexture, latticeWoodTexture, repeated } from '../../three/textures'
import { BACK_Z, DOOR } from './Architecture'
import { CarvedShape } from './Carved'
import { HangingLantern } from './Lanterns'
import { PALETTE, PlasterMaterial, WoodMaterial } from './materials'

/*
 * Main arch, built in the three layers of the "Arch – structure & details" sheet:
 *  1. carved arabesque panel (plaster) around the opening, over a dark recess
 *  2. smooth plaster arch frame
 *  3. inner carved wooden arch with a scalloped (cusped) edge
 * plus the hexagonal lantern hanging from the centre on a chain.
 */

const PANEL = { width: 4.7, cx: -0.51, top: 6.9 }
const PLASTER = { width: 4.36, spring: DOOR.spring, rise: 1.95, cx: DOOR.cx }
const INNER_BASE = 2.25

export default function Doorway() {
  // 1. carved spandrel panel (U-shaped around the plaster arch)
  const spandrel = useMemo(
    () => rectWithArchNotch({ width: PANEL.width, bottom: 0, top: PANEL.top, cx: PANEL.cx, arch: { ...PLASTER, cx: PLASTER.cx - PANEL.cx, width: PLASTER.width + 0.04, rise: PLASTER.rise + 0.02 } }),
    [],
  )
  const recessGeo = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape(spandrel)), [spandrel])

  // 2. plaster arch band
  const plasterGeo = useMemo(() => {
    const shape = archBandShape({ ...PLASTER, base: 0 }, { ...DOOR, base: 0 })
    return new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3, curveSegments: 32 })
  }, [])

  // 3. scalloped carved wooden inner arch
  const innerOuter = useMemo(() => {
    const outer = archPoints({ ...DOOR, base: INNER_BASE, segments: 60 })
    const inner = scallopedArch(outer, 13, 0.24)
    return [...outer, ...inner.reverse()]
  }, [])

  const pillarGlow = useMemo(() => repeated(latticeGlowTexture(), 0.58 / 0.3, 2.2 / 0.3), [])
  const pillarWood = useMemo(() => repeated(latticeWoodTexture(), 0.58 / 0.3, 3.2 / 0.3), [])

  const lantern = useRef()
  useFrame(({ clock }) => {
    if (lantern.current) lantern.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.012
  })

  return (
    <group>
      {/* 1 — carved arabesque panel over a dark recess */}
      <mesh geometry={recessGeo} position-z={BACK_Z + 0.004}>
        <meshStandardMaterial color="#2a1309" roughness={0.95} />
      </mesh>
      <CarvedShape outer={spandrel} cell={0.38} depth={0.05} margin={0.04} position-z={BACK_Z + 0.008}>
        <PlasterMaterial color="#d8956a" repeat={0.8} />
      </CarvedShape>

      {/* 2 — plaster arch frame */}
      <mesh geometry={plasterGeo} position-z={BACK_Z}>
        <PlasterMaterial color="#e3a77e" repeat={0.7} />
      </mesh>

      {/* 3 — inner carved wooden arch with cusped edge */}
      <CarvedShape outer={innerOuter} cell={0.13} depth={0.05} margin={0.02} position-z={BACK_Z + 0.16}>
        <WoodMaterial color="#6e3a1a" repeat={2} />
      </CarvedShape>

      {/* lattice pillar left of the arch: glowing lower half, carved upper half */}
      <group position={[-3.16, 0, BACK_Z + 0.03]}>
        <mesh position-y={1.5}>
          <planeGeometry args={[0.58, 2.2]} />
          <meshStandardMaterial map={pillarGlow} emissiveMap={pillarGlow} emissive="#ff9a3a" emissiveIntensity={1.4} />
        </mesh>
        <mesh position-y={4.2}>
          <planeGeometry args={[0.58, 3.2]} />
          <meshStandardMaterial map={pillarWood} roughness={0.7} />
        </mesh>
      </group>

      {/* hexagonal lantern hanging from the centre of the arch */}
      <group ref={lantern} position={[-0.5, 7, -3.7]}>
        <HangingLantern radius={0.22} bodyH={0.5} chain={2.3} intensity={9} distance={8} seed={3} />
      </group>

      <Balcony />
    </group>
  )
}

function Balcony() {
  const balRef = useRef()
  const ringRef = useRef()
  const z = -6.4
  const posts = useMemo(() => {
    const arr = []
    for (let x = -6; x <= 5; x += 0.13) arr.push(x)
    return arr
  }, [])
  const rings = useMemo(() => {
    const arr = []
    for (let x = -6; x <= 5; x += 0.26) arr.push(x + 0.065)
    return arr
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    posts.forEach((x, i) => balRef.current.setMatrixAt(i, m.makeTranslation(x, 0.5, z)))
    balRef.current.instanceMatrix.needsUpdate = true
    rings.forEach((x, i) => ringRef.current.setMatrixAt(i, m.makeTranslation(x, 0.62, z)))
    ringRef.current.instanceMatrix.needsUpdate = true
  }, [posts, rings])

  const iron = <meshStandardMaterial color="#1a1210" metalness={0.6} roughness={0.5} />
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[-0.5, 0.001, -5.9]}>
        <planeGeometry args={[12, 2.8]} />
        <meshStandardMaterial color="#b98a72" roughness={0.6} />
      </mesh>
      <instancedMesh ref={balRef} args={[undefined, undefined, posts.length]}>
        <cylinderGeometry args={[0.012, 0.012, 1, 5]} />
        {iron}
      </instancedMesh>
      <instancedMesh ref={ringRef} args={[undefined, undefined, rings.length]}>
        <torusGeometry args={[0.06, 0.01, 6, 16]} />
        {iron}
      </instancedMesh>
      {[1.02, 0.22, 0.05].map((y) => (
        <mesh key={y} position={[-0.5, y, z]}>
          <boxGeometry args={[11, y > 1 ? 0.05 : 0.025, 0.06]} />
          {iron}
        </mesh>
      ))}
    </group>
  )
}

export { PALETTE }
