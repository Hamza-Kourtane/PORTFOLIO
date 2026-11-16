import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carvedGeometry, rectPts } from '../../three/carve'
import { BRASS, BRONZE, GlowMaterial } from './materials'

function useFlicker(seed, base, lightRef, glowRef) {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 10
    const f = 1 + Math.sin(t * 7.3) * 0.035 + Math.sin(t * 13.1 + seed) * 0.025 + Math.sin(t * 2.1) * 0.04
    if (lightRef.current) lightRef.current.intensity = base * f
    if (glowRef.current) glowRef.current.color.setRGB(2.3 * f, 1.35 * f, 0.5 * f)
  })
}

/**
 * Square Moroccan fanoos (desk / shelves): four carved metal faces with a
 * rosette cut-out, corner posts, stepped roof with dome + finial, footed base,
 * and a glowing core.  `size` = width, height ≈ size.
 */
export function Fanoos({ size = 0.26, height, intensity = 2, distance = 2.6, light = true, seed = 1, ...props }) {
  const h = height ?? size
  const t = size * 0.035 // panel thickness
  const face = useMemo(() => carvedGeometry({ outer: rectPts(size * 0.9, h * 0.9), pattern: 'rosette', depth: t, margin: size * 0.045 }), [size, h, t])
  const lightRef = useRef()
  const glowRef = useRef()
  useFlicker(seed, intensity, lightRef, glowRef)

  const half = size / 2
  return (
    <group {...props}>
      {/* glowing core */}
      <mesh position-y={h / 2 + size * 0.06}>
        <boxGeometry args={[size * 0.78, h * 0.82, size * 0.78]} />
        <meshBasicMaterial ref={glowRef} color={[2.3, 1.35, 0.5]} toneMapped={false} />
      </mesh>
      {/* four carved faces */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        return (
          <mesh key={i} geometry={face} position={[Math.sin(a) * (half - t), h / 2 + size * 0.06, Math.cos(a) * (half - t)]} rotation-y={a}>
            <meshStandardMaterial {...BRONZE} />
          </mesh>
        )
      })}
      {/* corner posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * half, h / 2 + size * 0.06, z * half]}>
          <boxGeometry args={[size * 0.07, h, size * 0.07]} />
          <meshStandardMaterial {...BRONZE} />
        </mesh>
      ))}
      {/* base with feet */}
      <mesh position-y={size * 0.045}>
        <boxGeometry args={[size * 1.12, size * 0.05, size * 1.12]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * half * 0.95, size * 0.01, z * half * 0.95]}>
          <sphereGeometry args={[size * 0.035, 8, 8]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
      {/* stepped roof */}
      <mesh position-y={h + size * 0.08}>
        <boxGeometry args={[size * 1.1, size * 0.04, size * 1.1]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
      <mesh position-y={h + size * 0.16} rotation-y={Math.PI / 4}>
        <cylinderGeometry args={[size * 0.28, size * 0.68, size * 0.13, 4]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
      <mesh position-y={h + size * 0.25}>
        <sphereGeometry args={[size * 0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position-y={h + size * 0.42}>
        <coneGeometry args={[size * 0.035, size * 0.12, 8]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {light && <pointLight ref={lightRef} position-y={h / 2} color="#ffa142" intensity={intensity} distance={distance} decay={2} />}
    </group>
  )
}

/**
 * Hexagonal hanging lantern for the main arch: six girih-cut panels, pierced
 * dome top, tapered bottom cap with drop finial, and a real link chain.
 * Origin = top of the chain (ceiling).
 */
export function HangingLantern({ radius = 0.24, bodyH = 0.5, chain = 2.1, intensity = 9, distance = 8, seed = 3, ...props }) {
  const side = radius // hexagon side = circumradius
  const apothem = radius * Math.cos(Math.PI / 6)
  const t = 0.008
  const panel = useMemo(() => carvedGeometry({ outer: rectPts(side * 0.92, bodyH * 0.92), cell: side * 0.46, depth: t, margin: 0.008 }), [side, bodyH])
  const dome = useMemo(() => carvedGeometry({ outer: rectPts(side * 0.95, radius * 0.5), cell: side * 0.3, depth: t, margin: 0.006 }), [side, radius])
  const lightRef = useRef()
  const glowRef = useRef()
  useFlicker(seed, intensity, lightRef, glowRef)

  const chainRef = useRef()
  const linkCount = Math.round(chain / 0.05)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)
    for (let i = 0; i < linkCount; i++) {
      q.setFromEuler(new THREE.Euler(0, i % 2 ? Math.PI / 2 : 0, 0))
      m.compose(new THREE.Vector3(0, -i * 0.05 - 0.025, 0), q, s)
      chainRef.current.setMatrixAt(i, m)
    }
    chainRef.current.instanceMatrix.needsUpdate = true
  }, [linkCount])

  const bodyY = -chain - radius * 0.55 - bodyH / 2
  return (
    <group {...props}>
      <instancedMesh ref={chainRef} args={[undefined, undefined, linkCount]}>
        <torusGeometry args={[0.022, 0.005, 6, 12]} />
        <meshStandardMaterial {...BRONZE} />
      </instancedMesh>
      <group position-y={bodyY}>
        {/* glowing core */}
        <mesh>
          <cylinderGeometry args={[radius * 0.72, radius * 0.72, bodyH * 0.92, 6]} />
          <meshBasicMaterial ref={glowRef} color={[2.3, 1.35, 0.5]} toneMapped={false} />
        </mesh>
        {/* six carved panels */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3 + Math.PI / 6
          return (
            <mesh key={i} geometry={panel} position={[Math.sin(a) * apothem, 0, Math.cos(a) * apothem]} rotation-y={a}>
              <meshStandardMaterial {...BRONZE} />
            </mesh>
          )
        })}
        {/* frame: corner ribs + rims */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3
          return (
            <mesh key={i} position={[Math.sin(a) * radius, 0, Math.cos(a) * radius]}>
              <cylinderGeometry args={[0.009, 0.009, bodyH, 6]} />
              <meshStandardMaterial {...BRASS} />
            </mesh>
          )
        })}
        {[bodyH / 2, -bodyH / 2].map((y) => (
          <mesh key={y} position-y={y} rotation-y={Math.PI / 6}>
            <cylinderGeometry args={[radius * 1.06, radius * 1.06, 0.025, 6]} />
            <meshStandardMaterial {...BRONZE} />
          </mesh>
        ))}
        {/* pierced dome: six sloped carved panels */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3 + Math.PI / 6
          return (
            <group key={i} rotation-y={a}>
              <mesh geometry={dome} position={[0, bodyH / 2 + radius * 0.2, apothem * 0.62]} rotation-x={-0.75}>
                <meshStandardMaterial {...BRONZE} />
              </mesh>
            </group>
          )
        })}
        <mesh position-y={bodyH / 2 + radius * 0.2} rotation-y={Math.PI / 6}>
          <cylinderGeometry args={[radius * 0.4, radius * 0.9, radius * 0.4, 6, 1, true]} />
          <meshBasicMaterial color={[1.8, 1.0, 0.4]} toneMapped={false} side={THREE.BackSide} />
        </mesh>
        <mesh position-y={bodyH / 2 + radius * 0.48}>
          <cylinderGeometry args={[radius * 0.18, radius * 0.36, radius * 0.16, 6]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        <mesh position-y={bodyH / 2 + radius * 0.62}>
          <torusGeometry args={[0.03, 0.008, 6, 14]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        {/* bottom cap + finial drop */}
        <mesh position-y={-bodyH / 2 - radius * 0.28} rotation={[Math.PI, Math.PI / 6, 0]}>
          <cylinderGeometry args={[radius * 0.12, radius * 1.0, radius * 0.52, 6]} />
          <meshStandardMaterial {...BRONZE} />
        </mesh>
        <mesh position-y={-bodyH / 2 - radius * 0.62}>
          <sphereGeometry args={[radius * 0.1, 12, 10]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        <mesh position-y={-bodyH / 2 - radius * 0.8} rotation-x={Math.PI}>
          <coneGeometry args={[radius * 0.07, radius * 0.25, 8]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        <pointLight ref={lightRef} color="#ffa142" intensity={intensity} distance={distance} decay={2} />
      </group>
    </group>
  )
}

export { GlowMaterial }
