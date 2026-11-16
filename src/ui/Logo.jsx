/** Eight-point star emblem from the header of the reference image. */
export default function Logo({ size = 44 }) {
  const c = 50
  const sq = (rot) => (
    <rect x={c - 26} y={c - 26} width={52} height={52} transform={`rotate(${rot} ${c} ${c})`} fill="none" stroke="currentColor" strokeWidth="3.2" />
  )
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {sq(0)}
      {sq(45)}
      <circle cx={c} cy={c} r="14" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <circle cx={c} cy={c} r="5" fill="currentColor" />
    </svg>
  )
}
