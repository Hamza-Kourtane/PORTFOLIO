import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoomStore } from '../store/useRoomStore'
import { useDeepLink } from './useDeepLink'

/**
 * Makes any object clickable once its area is focused.
 * - hover: pointer cursor + a gentle lift
 * - click: camera frames the object (offset from its world position) and its panel opens
 */
export default function Interactive({ id, area, offset = [0, 0.2, 1.3], lift = 0.03, children, ...props }) {
  const group = useRef()
  const hovered = useRef(false)
  const activeArea = useRoomStore((s) => s.activeArea)
  const openObject = useRoomStore((s) => s.openObject)
  const selected = useRoomStore((s) => s.activeObject === id)
  const enabled = activeArea === area

  const open = () => {
    const c = new THREE.Vector3()
    group.current.updateWorldMatrix(true, false)
    group.current.getWorldPosition(c)
    document.body.style.cursor = 'auto'
    openObject(id, {
      position: [c.x + offset[0], c.y + offset[1], c.z + offset[2]],
      target: [c.x + 0.25, c.y + 0.1, c.z],
    })
  }
  useDeepLink(id, open)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const target = (hovered.current && enabled) || selected ? lift : 0
    g.position.y = THREE.MathUtils.damp(g.position.y, target, 10, dt)
  })

  return (
    <group {...props}>
      <group
        ref={group}
        onPointerOver={(e) => {
          if (!enabled) return
          e.stopPropagation()
          hovered.current = true
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hovered.current = false
          if (enabled) document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          if (!enabled) return
          e.stopPropagation()
          open()
        }}
      >
        {children}
      </group>
    </group>
  )
}
