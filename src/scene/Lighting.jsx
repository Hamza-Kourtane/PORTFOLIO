import { useState } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'

/** Soft-edged spot light that casts real shadows (target kept in the scene graph). */
function ShadowSpot({ position, target, mapSize = 2048, ...props }) {
  const [t] = useState(() => new THREE.Object3D())
  return (
    <>
      <primitive object={t} position={target} />
      <spotLight
        position={position}
        target={t}
        castShadow
        decay={2}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        {...props}
      />
    </>
  )
}

/**
 * Global light. Mood comes from the local lantern/niche lights and emissive
 * lattices (+ bloom); these add the warm key light (with soft shadows), the
 * lantern's down-light, dusk from outside, and reflections for metals.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight color="#ffb987" intensity={0.2} />
      <hemisphereLight args={['#ffb48a', '#4a2418', 0.45]} />
      {/* dusk light coming through the arch */}
      <directionalLight position={[-2, 8, -20]} color="#ff9e80" intensity={1.2} />

      {/* warm key light from the room side: shadows of the desk, robot, pouf, cat and plant */}
      <ShadowSpot position={[2.8, 6.4, 4.4]} target={[1.0, 0.6, -1.8]} color="#ffb37a" intensity={55} angle={0.68} penumbra={0.95} distance={22} />
      {/* soft fill so the front faces never go black */}
      <pointLight position={[0.5, 4.2, 4]} color="#ff9c6a" intensity={6} distance={16} decay={1.2} />

      {/* the hanging lantern lights the desk from above-behind: robot's shadow falls toward the viewer */}
      <ShadowSpot position={[-0.5, 4.15, -3.5]} target={[0.6, 1.0, -1.9]} color="#ffa142" intensity={12} angle={0.95} penumbra={1} distance={9} mapSize={1024} />

      {/* reflections for metals (tea set, laptop) — no network HDRI needed */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#ffb070" position={[0, 3, 5]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ff7a40" position={[-6, 2, -1]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={1} color="#c98ab0" position={[0, 4, -8]} scale={[6, 4, 1]} />
      </Environment>
    </>
  )
}
