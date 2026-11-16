import { useMemo } from 'react'
import { carvedGeometry, rectPts } from '../../three/carve'
import { glowTexture } from '../../three/textures'
import { GlowMaterial, WoodMaterial } from './materials'

/**
 * Rectangular carved mashrabiya panel with real cut-outs, optionally
 * back-lit by a warm diffuser plane (the "construction" stack on the sheets:
 * frame → carved panel → backlight → wall).
 */
export function CarvedPanel({
  width,
  height,
  cell = 0.22,
  depth = 0.03,
  pattern = 'girih',
  margin,
  backlight = true,
  glow = 1.25,
  color = '#7a3e1c',
  material,
  ...props
}) {
  const geo = useMemo(
    () => carvedGeometry({ outer: rectPts(width, height), pattern, cell, depth, margin: margin ?? cell * 0.12 }),
    [width, height, cell, depth, pattern, margin],
  )
  return (
    <group {...props}>
      <mesh geometry={geo}>{material ?? <WoodMaterial color={color} repeat={1.6} />}</mesh>
      {backlight && (
        <mesh position-z={-0.03}>
          <planeGeometry args={[width * 0.98, height * 0.98]} />
          <meshBasicMaterial map={glowTexture()} color={[glow, glow, glow]} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/** Carved geometry from any outline (arches, U-shaped spandrels, crests). */
export function CarvedShape({ outer, exclude, cutouts, cell = 0.22, depth = 0.03, margin, pattern = 'girih', children, ...props }) {
  const geo = useMemo(
    () => carvedGeometry({ outer, exclude, cutouts, pattern, cell, depth, margin: margin ?? cell * 0.12 }),
    [outer, exclude, cutouts, cell, depth, margin, pattern],
  )
  return (
    <mesh geometry={geo} {...props}>
      {children ?? <WoodMaterial repeat={1.6} />}
    </mesh>
  )
}

/** Thin emissive tube following a list of points (LED strips along arches). */
export { GlowMaterial }
