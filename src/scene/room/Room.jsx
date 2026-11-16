import { useLayoutEffect, useRef } from 'react'
import Architecture from './Architecture'
import Doorway from './Doorway'
import Outside from './Outside'
import { LeftNiche, RightWall, WallIvy } from './Niches'
import Desk from './Desk'
import Robot from './Robot'
import { PoufWithCat, Rug } from './Decor'
import { BigPlant, Foliage } from './Plants'

/**
 * Turns on shadows for everything inside: lit (non-glowing) meshes receive
 * shadows, and cast them too when `cast` is set. Glow surfaces and fur shells are skipped.
 */
function Shadows({ cast = false, children }) {
  const ref = useRef()
  useLayoutEffect(() => {
    ref.current.traverse((o) => {
      if (!o.isMesh || o.userData.noShadow || o.material?.isMeshBasicMaterial) return
      o.receiveShadow = true
      if (cast) o.castShadow = true
    })
  }, [cast])
  return <group ref={ref}>{children}</group>
}

/**
 * The full room, laid out to match the reference image.
 * World units ≈ metres. Back wall front face at z = -4.5, camera at z = 7.5.
 */
export default function Room() {
  return (
    <group>
      <Outside />
      <Shadows>
        <Architecture />
        <Doorway />
        <LeftNiche />
        <RightWall />
        <WallIvy />
        <Rug position={[1.1, 0.006, -0.9]} />
      </Shadows>
      <Shadows cast>
        <Desk position={[0.965, 0, -1.6]} />
        {/* sitting behind the desk, facing the laptop */}
        <Robot position={[0.33, 0, -2.74]} rotation-y={0.8} />
        <PoufWithCat position={[2.75, 0, -0.25]} scale={1.1} />
        <BigPlant position={[5.85, 0, -3.5]} scale={1.35} seed={4} />
      </Shadows>

      {/* foreground framing leaves (bottom-left, top-left, top-centre, top-right) */}
      <Foliage position={[-3.05, 1.05, 3.2]} count={9} size={[0.35, 0.75]} spreadX={0.2} spreadY={0.3} seed={1} />
      <Foliage position={[-3.0, 3.6, 3.0]} count={5} size={[0.25, 0.5]} spreadX={0.15} spreadY={0.08} seed={2} droop={Math.PI} />
      <Foliage position={[-1.45, 3.7, 3.0]} count={4} size={[0.22, 0.45]} spreadX={0.2} spreadY={0.05} seed={3} droop={Math.PI} />
      <Foliage position={[3.05, 3.35, 3.0]} count={6} size={[0.3, 0.6]} spreadX={0.12} spreadY={0.25} seed={5} droop={Math.PI} />
    </group>
  )
}
