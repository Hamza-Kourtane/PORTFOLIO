import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { AREAS, AREAS_BY_ID } from '../config/areas'
import { useRoomStore } from '../store/useRoomStore'

const setCursor = (c) => (document.body.style.cursor = c)

function Hotspot({ area }) {
  const entered = useRoomStore((s) => s.entered)
  const activeArea = useRoomStore((s) => s.activeArea)
  const hovered = useRoomStore((s) => s.hoveredArea === area.id)
  const focusArea = useRoomStore((s) => s.focusArea)
  const setHovered = useRoomStore((s) => s.setHovered)

  const clickable = entered && activeArea !== area.id
  const showMarker = entered && !activeArea

  const focus = () => {
    setCursor('auto')
    focusArea(area.id)
  }

  return (
    <group>
      {clickable && (
        <mesh
          position={area.hitbox.position}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(area.id)
            setCursor('pointer')
          }}
          onPointerOut={() => {
            setHovered(null)
            setCursor('auto')
          }}
          onClick={(e) => {
            e.stopPropagation()
            focus()
          }}
        >
          <boxGeometry args={area.hitbox.size} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
      {showMarker && (
        <Html position={area.marker} center zIndexRange={[20, 0]}>
          <button
            className={`hotspot ${hovered ? 'is-hovered' : ''}`}
            onClick={focus}
            onMouseEnter={() => setHovered(area.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="hotspot__dot" />
            <span className="hotspot__label">
              <em>{area.index}</em> {area.label}
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

/** A single warm light that drifts to the hovered area and fades in. */
function HoverGlow() {
  const light = useRef()
  const target = useRef(new THREE.Vector3())
  useFrame((_, dt) => {
    const id = useRoomStore.getState().hoveredArea
    const area = id && AREAS_BY_ID[id]
    if (area) target.current.set(area.marker[0], area.marker[1] - 0.6, area.marker[2] + 1.2)
    const l = light.current
    l.position.lerp(target.current, area ? 1 : 0)
    l.intensity = THREE.MathUtils.damp(l.intensity, area ? 7 : 0, 6, dt)
  })
  return <pointLight ref={light} color="#ffb060" intensity={0} distance={4.5} decay={2} />
}

export default function Hotspots() {
  useEffect(() => () => setCursor('auto'), [])
  return (
    <>
      {AREAS.map((a) => (
        <Hotspot key={a.id} area={a} />
      ))}
      <HoverGlow />
    </>
  )
}
