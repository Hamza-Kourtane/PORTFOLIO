import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Sparkles } from '@react-three/drei'
import { INTRO_VIEW } from '../config/areas'
import Room from './room/Room'
import Lighting from './Lighting'
import Effects from './Effects'
import CameraRig from './CameraRig'
import Hotspots from './Hotspots'

/** Dev only: logs draw calls / triangles once the scene has settled. */
function RenderStats() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const id = setTimeout(() => {
      let meshes = 0
      let tris = 0
      const heavy = []
      scene.traverse((o) => {
        if (!o.isMesh || !o.visible) return
        const g = o.geometry
        const t = ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1)
        meshes++
        tris += t
        if (t > 20000) heavy.push(`${o.parent?.type}/${o.geometry.type}:${Math.round(t / 1000)}k`)
      })
      console.log(`[stats] meshes(draw calls): ${meshes}, triangles: ${Math.round(tris / 1000)}k, heavy: ${heavy.join(', ')}`)
    }, 4000)
    return () => clearTimeout(id)
  }, [scene])
  return null
}

export default function Experience() {
  return (
    <Canvas
      className="scene"
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 32, near: 0.1, far: 800, position: INTRO_VIEW.position }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#1a0c08']} />
      <Suspense fallback={null}>
        <Lighting />
        <Room />
        {/* soft contact shadows under desk, chair, pouf and plant (baked once) */}
        <ContactShadows position={[0.8, 0.012, -1.2]} scale={[13, 8]} resolution={1024} far={2.5} blur={2.6} opacity={0.4} frames={1} color="#2a0f05" />
        {/* warm dust in the air */}
        <Sparkles count={70} scale={[11, 4.5, 6]} position={[0.3, 2.6, -1.5]} size={2.2} speed={0.18} opacity={0.55} color="#ffcf8a" />
        <Hotspots />
        <Effects />
      </Suspense>
      <CameraRig />
      <RenderStats />
    </Canvas>
  )
}
