import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { puffTexture } from '../../three/textures'

/**
 * Gentle steam: soft puffs that rise, drift, grow and fade, on a loop.
 * Origin = where the steam leaves (spout tip, top of a tea glass).
 */
export default function Steam({ count = 9, rise = 0.32, width = 0.03, size = 0.05, life = 3.2, opacity = 0.32, ...props }) {
  const group = useRef()
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        offset: (i / count) * life,
        sway: 0.6 + Math.random() * 0.8,
        phase: Math.random() * 6,
        spin: (Math.random() - 0.5) * 0.6,
        material: new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, depthWrite: false, color: '#fff3e6', opacity: 0 }),
      })),
    [count, life],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current?.children.forEach((s, i) => {
      const p = puffs[i]
      const a = ((t + p.offset) % life) / life // 0 → 1 over the puff's life
      s.position.set(Math.sin(a * 5 * p.sway + p.phase) * width * (0.4 + a), a * rise, Math.cos(a * 4 * p.sway + p.phase) * width * 0.5 * a)
      s.scale.setScalar(size * (0.35 + a * 2.6))
      p.material.rotation = p.phase + a * p.spin * 4
      p.material.opacity = opacity * Math.sin(Math.PI * Math.min(1, a * 1.15)) * (1 - a * 0.35)
    })
  })
  return (
    <group ref={group} {...props}>
      {puffs.map((p, i) => (
        <sprite key={i} material={p.material} />
      ))}
    </group>
  )
}
