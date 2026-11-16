import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { AREAS_BY_ID, HOME_VIEW, INTRO_VIEW } from '../config/areas'
import { useRoomStore } from '../store/useRoomStore'

/*
 * Camera behaviour (inspired by the reference site):
 *  - intro: starts pulled back, dollies into the room when the visitor enters
 *  - overview: drag to look around within a small cone, no zoom/pan
 *  - area focus: smooth fly-to the area's framing, look-around re-centred there
 */

function unlock(c) {
  c.minAzimuthAngle = -Infinity
  c.maxAzimuthAngle = Infinity
  c.minPolarAngle = 0
  c.maxPolarAngle = Math.PI
}

function lockAround(c, range) {
  const az = c.azimuthAngle
  const po = c.polarAngle
  c.minAzimuthAngle = az - range
  c.maxAzimuthAngle = az + range
  c.minPolarAngle = po - range * 0.6
  c.maxPolarAngle = po + range * 0.6
}

// dev only: ?cam=px,py,pz,tx,ty,tz puts the camera anywhere (for checking details)
const DEV_CAM = import.meta.env.DEV && new URLSearchParams(window.location.search).get('cam')?.split(',').map(Number)

export default function CameraRig() {
  const ref = useRef()
  const firstRun = useRef(true)
  const entered = useRoomStore((s) => s.entered)
  const activeArea = useRoomStore((s) => s.activeArea)
  const objectFocus = useRoomStore((s) => s.objectFocus)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    // fixed camera: no drag, zoom or pan — it only moves when a place is clicked
    c.mouseButtons.left = 0
    c.mouseButtons.wheel = 0
    c.mouseButtons.right = 0
    c.mouseButtons.middle = 0
    c.touches.one = 0
    c.touches.two = 0
    c.touches.three = 0
    c.smoothTime = 0.9
    c.draggingSmoothTime = 0.2
    c.azimuthRotateSpeed = 0.3
    c.polarRotateSpeed = 0.3
  }, [])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const view = DEV_CAM
      ? { position: DEV_CAM.slice(0, 3), target: DEV_CAM.slice(3), range: 0 }
      : !entered
      ? INTRO_VIEW
      : objectFocus
        ? { ...objectFocus, range: 0 }
        : AREAS_BY_ID[activeArea]?.camera ?? HOME_VIEW
    let cancelled = false
    const animate = entered && !firstRun.current
    firstRun.current = false
    unlock(c)
    c.setLookAt(...view.position, ...view.target, animate).then(() => {
      if (!cancelled && entered) lockAround(c, view.range ?? 0.1)
    })
    return () => {
      cancelled = true
    }
  }, [entered, activeArea, objectFocus])

  return <CameraControls ref={ref} makeDefault />
}
