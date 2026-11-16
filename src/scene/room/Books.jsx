import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { leatherBump, repeated } from '../../three/textures'
import { mulberry32, pick, range } from '../../three/random'
import { useRoomStore } from '../../store/useRoomStore'
import { useDeepLink } from '../useDeepLink'

/*
 * Books per the "Books (shelf)" sheet: leather boards + spine, cream page
 * block visible on top/front/bottom, two pairs of gold bands and a small gold
 * lozenge on a blank spine. No titles.
 *
 * Decorative books are instanced (5 draw calls for any number of books).
 * Feature books (`features`) are real meshes and clickable inside their area.
 */

export const BOOK_COLORS = ['#1b2a41', '#7b3b2a', '#5a1e23', '#e6d3b0', '#1e4d3a', '#8b1e24']
const T = 0.006 // board thickness

const unitBox = new THREE.BoxGeometry(1, 1, 1)
let mats
function materials() {
  if (mats) return mats
  mats = {
    cover: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, bumpMap: repeated(leatherBump(), 0.6), bumpScale: 1.4 }),
    pages: new THREE.MeshStandardMaterial({ color: '#e9dcc0', roughness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: '#d4a850', metalness: 1, roughness: 0.3 }),
  }
  return mats
}

/** Part boxes of one book in book-centre space: [material, position, size, rotZ]. */
function bookParts(w, h, d) {
  const parts = [
    ['cover', [-w / 2 + T / 2, 0, 0], [T, h, d]],
    ['cover', [w / 2 - T / 2, 0, 0], [T, h, d]],
    ['cover', [0, 0, d / 2 - T / 2], [w, h, T]],
    ['pages', [0, 0, (0.004 - T) / 2], [w - 2 * T, h - 0.012, d - T - 0.004]],
  ]
  for (const y of [h / 2 - 0.022, h / 2 - 0.034, -h / 2 + 0.022, -h / 2 + 0.034]) {
    parts.push(['gold', [0, y, d / 2 + 0.0008], [w + 0.0015, 0.0045, 0.002]])
  }
  parts.push(['gold', [0, h * 0.16, d / 2 + 0.001], [Math.min(w * 0.35, 0.016), Math.min(w * 0.35, 0.016), 0.002], Math.PI / 4])
  for (const f of [0.31, -0.04, -0.27]) parts.push(['cover', [0, h * f, d / 2 + 0.0015], [w + 0.001, 0.007, 0.004]])
  return parts
}

/** Book centre transform from a descriptor. Upright: x=thickness, y=height, spine faces +z. */
function bookMatrix(b, slide = 0) {
  const lying = b.lying
  const cy = lying ? b.w / 2 : b.h / 2
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.rotY ?? 0, lying ? Math.PI / 2 : -(b.lean ?? 0)))
  const leanShift = b.lean ? (Math.sin(b.lean) * b.h) / 2 : 0
  return new THREE.Matrix4().compose(new THREE.Vector3(b.x + leanShift, b.y + cy, (b.z ?? 0) + slide), q, new THREE.Vector3(1, 1, 1))
}

/* ---------------------------------------------------------------- instanced */
export function BookInstances({ books }) {
  const refs = { cover: useRef(), pages: useRef(), gold: useRef() }
  const counts = useMemo(() => {
    const c = { cover: 0, pages: 0, gold: 0 }
    books.forEach((b) => bookParts(b.w, b.h, b.d).forEach(([m]) => c[m]++))
    return c
  }, [books])

  useLayoutEffect(() => {
    const idx = { cover: 0, pages: 0, gold: 0 }
    const color = new THREE.Color()
    const part = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    books.forEach((b) => {
      const B = bookMatrix(b)
      bookParts(b.w, b.h, b.d).forEach(([m, p, s, rz]) => {
        q.setFromEuler(new THREE.Euler(0, 0, rz ?? 0))
        part.compose(new THREE.Vector3(...p), q, new THREE.Vector3(...s))
        const mesh = refs[m].current
        mesh.setMatrixAt(idx[m], B.clone().multiply(part))
        if (m === 'cover') mesh.setColorAt(idx[m], color.set(b.color))
        idx[m]++
      })
    })
    for (const k of Object.keys(refs)) {
      refs[k].current.instanceMatrix.needsUpdate = true
      if (refs[k].current.instanceColor) refs[k].current.instanceColor.needsUpdate = true
    }
  }, [books])

  const M = materials()
  return (
    <>
      <instancedMesh ref={refs.cover} args={[unitBox, M.cover, counts.cover]} />
      <instancedMesh ref={refs.pages} args={[unitBox, M.pages, counts.pages]} />
      <instancedMesh ref={refs.gold} args={[unitBox, M.gold, counts.gold]} />
    </>
  )
}

/* ---------------------------------------------------------------- interactive book */
/**
 * Clickable book.
 * - hover (inside its area): slides out of the shelf + floating name tag
 * - click, `book.fly`: flies off the shelf to just in front of the camera,
 *   cover facing you; the full-screen open-book page then takes over (ui/ExperienceBook)
 * - click, otherwise: camera moves in to frame the book
 */
export function Book({ book, area }) {
  const group = useRef()
  const camera = useThree((s) => s.camera)
  const coverMat = useMemo(() => {
    const m = materials().cover.clone()
    m.color.set(book.color)
    return m
  }, [book.color])
  const parts = useMemo(() => bookParts(book.w, book.h, book.d), [book])
  const M = materials()

  const [hovered, setHovered] = useState(false)
  const activeArea = useRoomStore((s) => s.activeArea)
  const selected = useRoomStore((s) => s.activeObject === book.id)
  const openObject = useRoomStore((s) => s.openObject)
  const enabled = activeArea === area

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      scl: new THREE.Vector3(),
      parentQ: new THREE.Quaternion(),
      dir: new THREE.Vector3(),
      // front cover toward the camera, slightly tilted like it's held in hand
      turn: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, -Math.PI / 2 + 0.18, 0.04)),
      tilt: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.09, 0, 0)),
    }),
    [],
  )

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const u = g.userData
    u.selT = selected ? (u.selT ?? 0) + dt : 0
    u.backT = !selected && u.wasOut ? (u.backT ?? 0) + dt : 0
    if (selected && book.fly && u.selT > 0.32) {
      // fly to just in front of the camera, cover toward you
      tmp.dir.set(0, -0.03, -1).applyQuaternion(camera.quaternion)
      tmp.pos.copy(camera.position).addScaledVector(tmp.dir, 1.0)
      g.parent.worldToLocal(tmp.pos)
      g.parent.getWorldQuaternion(tmp.parentQ).invert()
      tmp.quat.copy(tmp.parentQ).multiply(camera.quaternion).multiply(tmp.turn)
      u.wasOut = true
    } else if ((selected && book.fly) || (u.wasOut && u.backT < 0.7)) {
      // pulled right out of the shelf (start of the flight / end of the return)
      bookMatrix(book, book.d * 1.15).decompose(tmp.pos, tmp.quat, tmp.scl)
    } else {
      u.wasOut = false
      const on = hovered && enabled
      bookMatrix(book, on ? 0.12 : 0).decompose(tmp.pos, tmp.quat, tmp.scl)
      // hover: the top tips toward you, like a finger pulling it out
      if (on) tmp.quat.multiply(tmp.tilt)
    }
    if (!g.userData.ready) {
      g.position.copy(tmp.pos)
      g.quaternion.copy(tmp.quat)
      g.userData.ready = true
    }
    const k = 1 - Math.exp(-(selected ? (u.selT > 0.32 ? 4.5 : 12) : u.wasOut ? 5 : 10) * dt)
    g.position.lerp(tmp.pos, k)
    g.quaternion.slerp(tmp.quat, k)
    // soft golden pulse tells the visitor these books are interactive
    const glow = enabled && !selected ? (hovered ? 0.75 : 0.18 + 0.14 * Math.sin(state.clock.elapsedTime * 2.4)) : 0
    coverMat.emissive.setRGB(0.3, 0.15, 0.04).multiplyScalar(glow)
  })

  const open = () => {
    document.body.style.cursor = 'auto'
    setHovered(false)
    if (book.fly) return openObject(book.id, null)
    const c = new THREE.Vector3()
    group.current.updateWorldMatrix(true, false)
    group.current.getWorldPosition(c)
    openObject(book.id, { position: [c.x + 0.35, c.y + 0.12, c.z + 1.6], target: [c.x + 0.3, c.y, c.z] })
  }
  useDeepLink(book.id, open)

  return (
    <group
      ref={group}
      onClick={(e) => {
        if (!enabled) return
        e.stopPropagation()
        open()
      }}
      onPointerOver={(e) => {
        if (!enabled || selected) return
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        if (enabled) document.body.style.cursor = 'auto'
      }}
    >
      {parts.map(([m, p, s, rz], i) => (
        <mesh key={i} geometry={unitBox} material={m === 'cover' ? coverMat : M[m]} position={p} scale={s} rotation-z={rz ?? 0} castShadow receiveShadow />
      ))}
      {hovered && enabled && !selected && book.label && (
        <Html position={[0, book.h / 2 + 0.07, book.d / 2]} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div className="book-tag">
            <b>{book.label}</b>
            <span>{book.sub}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

/* ---------------------------------------------------------------- layouts */
/**
 * Upright row of books standing on a shelf, filling `width` from x=0 along +x.
 * `features` (clickable) are placed first, then decorative books fill the rest.
 */
export function BookRow({ width = 0.6, height = [0.3, 0.42], depth = 0.24, seed = 1, lean = true, features = [], area, ...props }) {
  const { feat, deco } = useMemo(() => {
    const r = mulberry32(seed)
    const feat = []
    const deco = []
    let x = 0
    features.forEach((f, i) => {
      const w = f.w ?? range(r, 0.05, 0.07)
      feat.push({ ...f, x: x + w / 2, y: 0, w, h: f.h ?? range(r, height[0], height[1]), d: depth, color: f.color ?? BOOK_COLORS[i % BOOK_COLORS.length] })
      x += w + 0.003
    })
    while (x < width - 0.03) {
      const w = range(r, 0.032, 0.06)
      deco.push({ x: x + w / 2, y: 0, w, h: range(r, height[0], height[1]), d: depth * range(r, 0.9, 1), color: pick(r, BOOK_COLORS) })
      x += w + 0.003
    }
    if (lean && deco.length > 3) {
      const last = deco[deco.length - 1]
      last.lean = 0.22
      last.x += 0.02
    }
    return { feat, deco }
  }, [width, height, depth, seed, lean, features])

  return (
    <group {...props}>
      <BookInstances books={deco} />
      {feat.map((b) => (
        <Book key={b.id} book={b} area={area} />
      ))}
    </group>
  )
}

/** Books lying flat, stacked (spines toward the viewer). */
export function BookStack({ count = 3, size = [0.45, 0.06, 0.32], seed = 2, colors, ...props }) {
  const books = useMemo(() => {
    const r = mulberry32(seed)
    let y = 0
    return Array.from({ length: count }, (_, i) => {
      const w = size[1] * range(r, 0.85, 1.15)
      const b = { x: 0, y, w, h: size[0] * range(r, 0.9, 1.05), d: size[2] * range(r, 0.9, 1.05), lying: true, rotY: range(r, -0.12, 0.12), color: colors?.[i] ?? pick(r, BOOK_COLORS) }
      y += w
      return b
    })
  }, [count, size, seed, colors])
  return (
    <group {...props}>
      <BookInstances books={books} />
    </group>
  )
}
