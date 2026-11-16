import { Bloom, EffectComposer, N8AO, Vignette } from '@react-three/postprocessing'

/** Restrained bloom: only real light sources (LEDs, lantern cores, screens) glow. */
export default function Effects() {
  return (
    <EffectComposer multisampling={4} disableNormalPass>
      {/* ambient occlusion: soft darkening where objects meet (desk/rug, books/shelf, cat/pouf) */}
      <N8AO halfRes aoRadius={0.5} distanceFalloff={0.6} intensity={2.4} color="#2a0f05" />
      <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.6} radius={0.65} />
      <Vignette offset={0.3} darkness={0.5} />
    </EffectComposer>
  )
}
