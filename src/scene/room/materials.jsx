import { useMemo } from 'react'
import { leatherBump, plasterBump, repeated, woodTextures } from '../../three/textures'

/* Palette taken from the reference sheets */
export const PALETTE = {
  darkWood: '#2b1a10',
  walnut: '#8b4a22',
  walnutDeep: '#5e2e14',
  amber: '#d97a2d',
  glow: '#ffc46a',
  cream: '#f4e6d1',
  teal: '#0c5b56',
  tealDeep: '#0a3f3a',
  leather: '#7a3a1c',
  leatherDark: '#4a2e1a',
  stitch: '#e6c39c',
  bronze: '#6b4a2a',
  brass: '#d4a850',
}

export const BRONZE = { color: PALETTE.bronze, metalness: 0.85, roughness: 0.38 }
export const BRASS = { color: PALETTE.brass, metalness: 1, roughness: 0.28 }

/** Walnut with grain map + bump. `repeat` = texture tiles per geometry UV unit. */
export function WoodMaterial({ color = PALETTE.walnut, repeat = 1.5, roughness = 0.42, bumpScale = 0.25, ...props }) {
  const { map, bump } = useMemo(() => {
    const t = woodTextures(color)
    return { map: repeated(t.map, repeat), bump: repeated(t.bump, repeat) }
  }, [color, repeat])
  return <meshStandardMaterial map={map} bumpMap={bump} bumpScale={bumpScale} roughness={roughness} {...props} />
}

export function LeatherMaterial({ color = PALETTE.leather, repeat = 2, roughness = 0.5, ...props }) {
  const bump = useMemo(() => repeated(leatherBump(), repeat), [repeat])
  return <meshStandardMaterial color={color} bumpMap={bump} bumpScale={1.6} roughness={roughness} {...props} />
}

export function PlasterMaterial({ color = '#c98e6a', repeat = 0.6, ...props }) {
  const bump = useMemo(() => repeated(plasterBump(), repeat), [repeat])
  return <meshStandardMaterial color={color} bumpMap={bump} bumpScale={1.5} roughness={0.8} {...props} />
}

/** Bright amber light source surface (feeds bloom). */
export function GlowMaterial({ strength = 2.2, ...props }) {
  return <meshBasicMaterial color={[strength, strength * 0.6, strength * 0.24]} toneMapped={false} {...props} />
}
