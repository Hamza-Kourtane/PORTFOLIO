/** Thin LED strip that feeds the bloom pass. */
export function GlowStrip({ size = [1, 0.015, 0.02], strength = 2.6, ...props }) {
  return (
    <mesh {...props}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={[strength, strength * 0.62, strength * 0.25]} toneMapped={false} />
    </mesh>
  )
}
