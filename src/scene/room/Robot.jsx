import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { robotFaceTexture, soleTexture } from '../../three/textures'
import { starPts } from '../../three/carve'
import { BRASS, LeatherMaterial, PALETTE } from './materials'

/*
 * Robot per the character sheet: cream matte plastic (#F6E5D0), semi-gloss
 * black joints (#1A1A1A), orange LED ear rings + pixel face (#FF8A00),
 * brass antenna & chest star (#D4A850), orange tread soles (#E0792A).
 * Pose: small and cute, sitting at the desk working — legs under the desk,
 * both hands typing on the laptop, head tilted down toward the screen.
 * Robot faces +z (toward the desk / camera).
 */

const SHELL = { color: '#f6e5d0', roughness: 0.55 }
const JOINT = { color: '#1a1a1a', roughness: 0.32, metalness: 0.2 }
const LED = { color: '#ff8a00', emissive: '#ff8a00', emissiveIntensity: 2.4, toneMapped: false }

const v3 = (a) => new THREE.Vector3(...a)

function Segment({ from, to, radius = 0.06 }) {
  const { pos, quat, len } = useMemo(() => {
    const a = v3(from)
    const b = v3(to)
    const dir = b.clone().sub(a)
    return {
      pos: a.clone().add(b).multiplyScalar(0.5),
      len: Math.max(0.001, dir.length() - radius * 1.2),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()),
    }
  }, [from, to, radius])
  return (
    <mesh position={pos} quaternion={quat}>
      <capsuleGeometry args={[radius, len, 6, 14]} />
      <meshStandardMaterial {...SHELL} />
    </mesh>
  )
}

function Joint({ p, r = 0.07 }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[r, 20, 16]} />
      <meshStandardMaterial {...JOINT} />
    </mesh>
  )
}

/** Shoulder/hip joint, upper segment, elbow/knee joint, lower segment. */
function Limb({ a, b, c, r = 0.06 }) {
  return (
    <>
      <Joint p={a} r={r * 1.2} />
      <Segment from={a} to={b} radius={r} />
      <Joint p={b} r={r * 1.1} />
      <Segment from={b} to={c} radius={r * 1.05} />
    </>
  )
}

/** Round mitten hand. */
function Hand({ p, r = 0.075 }) {
  return (
    <mesh position={p} scale={[1, 0.85, 1]}>
      <sphereGeometry args={[r, 20, 16]} />
      <meshStandardMaterial {...SHELL} />
    </mesh>
  )
}

/** Chunky shoe standing flat on the floor, orange tread sole underneath. */
function Foot({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[0.17, 0.13, 0.26]} radius={0.06} smoothness={4} position={[0, 0.095, 0.03]}>
        <meshStandardMaterial {...SHELL} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.04, 0.28]} radius={0.018} smoothness={3} position={[0, 0.02, 0.03]}>
        <meshStandardMaterial map={soleTexture()} roughness={0.75} />
      </RoundedBox>
    </group>
  )
}

function ChestStar(props) {
  const geo = useMemo(() => new THREE.ExtrudeGeometry(new THREE.Shape(starPts(0, 0, 0.1, 0.055, 8, Math.PI / 8)), { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), [])
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshStandardMaterial {...BRASS} emissive="#7a4a10" emissiveIntensity={0.35} />
      </mesh>
      <mesh position-z={0.018}>
        <circleGeometry args={[0.025, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  )
}

function Ear({ side }) {
  return (
    <group position-x={side * 0.5} rotation-z={(side * Math.PI) / 2}>
      <mesh>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 32]} />
        <meshStandardMaterial {...SHELL} />
      </mesh>
      <mesh position-y={-side * 0.045} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.12, 0.032, 12, 40]} />
        <meshStandardMaterial {...LED} />
      </mesh>
      <mesh position-y={-side * 0.05}>
        <cylinderGeometry args={[0.085, 0.085, 0.02, 24]} />
        <meshStandardMaterial {...SHELL} />
      </mesh>
    </group>
  )
}

/** Big round head (chibi proportions). `y` = resting height of the head centre. */
function Head({ y }) {
  const group = useRef()
  const faceMat = useRef()
  const faces = useMemo(() => ({ happy: robotFaceTexture('happy'), wink: robotFaceTexture('wink') }), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) {
      // looking down at the screen, small focused nods
      group.current.rotation.z = Math.sin(t * 0.5) * 0.03
      group.current.rotation.x = 0.16 + Math.sin(t * 2.2) * 0.015
      group.current.position.y = y + Math.sin(t * 1.6) * 0.008
    }
    // idle: wink for a moment every ~7 s
    if (faceMat.current) {
      const map = t % 7 > 6.6 ? faces.wink : faces.happy
      if (faceMat.current.map !== map) faceMat.current.map = map
    }
  })
  return (
    <group ref={group} position={[0, y, 0]} rotation={[0.16, 0, 0]} scale={0.72}>
      <RoundedBox args={[1.0, 0.76, 0.68]} radius={0.26} smoothness={8}>
        <meshStandardMaterial {...SHELL} />
      </RoundedBox>
      {/* screen bezel + LED face */}
      <RoundedBox args={[0.84, 0.58, 0.08]} radius={0.16} smoothness={6} position-z={0.31}>
        <meshStandardMaterial color="#050507" roughness={0.12} metalness={0.4} />
      </RoundedBox>
      <mesh position-z={0.352}>
        <planeGeometry args={[0.72, 0.46]} />
        <meshBasicMaterial ref={faceMat} map={faces.happy} color={[1.5, 1.5, 1.5]} toneMapped={false} />
      </mesh>
      <Ear side={-1} />
      <Ear side={1} />
      {/* antenna */}
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.035, 24]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.26, 8]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.045, 20, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  )
}

/** Arm reaching forward to the keyboard; tapping in bursts with short pauses. */
function TypingArm({ side, phase }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + phase
    const burst = Math.sin(t * 0.9) > -0.3 ? 1 : 0 // pause now and then, like thinking
    ref.current.rotation.x = burst * Math.max(0, Math.sin(t * 15)) * -0.035
  })
  return (
    <group position={[side * 0.27, 1.32, -0.02]}>
      <group ref={ref}>
        <Limb a={[0, 0, 0]} b={[side * 0.04, -0.2, 0.32]} c={[-side * 0.13, -0.07, 0.68]} r={0.055} />
        <Hand p={[-side * 0.14, -0.07, 0.72]} r={0.068} />
      </group>
    </group>
  )
}

function TuftedChair() {
  const buttons = useRef()
  const pts = useMemo(() => {
    const out = []
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4 - (r % 2); c++) out.push([-0.36 + c * 0.24 + (r % 2) * 0.12, -0.45 + r * 0.3])
    return out
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    pts.forEach(([x, y], i) => buttons.current.setMatrixAt(i, m.makeTranslation(x, y, 0.165)))
    buttons.current.instanceMatrix.needsUpdate = true
  }, [pts])
  return (
    <group position={[0, 0, -0.08]}>
      <mesh position-y={0.34}>
        <cylinderGeometry args={[0.06, 0.08, 0.52, 14]} />
        <meshStandardMaterial {...JOINT} />
      </mesh>
      <mesh position-y={0.04}>
        <cylinderGeometry args={[0.46, 0.46, 0.05, 5]} />
        <meshStandardMaterial {...JOINT} />
      </mesh>
      <RoundedBox args={[1.05, 0.26, 0.9]} radius={0.11} smoothness={5} position-y={0.7}>
        <LeatherMaterial color={PALETTE.leather} />
      </RoundedBox>
      <group position={[0, 1.42, -0.42]} rotation-x={-0.14}>
        <RoundedBox args={[1.12, 1.4, 0.3]} radius={0.15} smoothness={5}>
          <LeatherMaterial color={PALETTE.leather} />
        </RoundedBox>
        <instancedMesh ref={buttons} args={[undefined, undefined, pts.length]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color={PALETTE.leatherDark} roughness={0.4} />
        </instancedMesh>
      </group>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.18, 0.3, 0.8]} radius={0.08} smoothness={4} position={[s * 0.6, 0.95, -0.02]}>
          <LeatherMaterial color={PALETTE.leather} />
        </RoundedBox>
      ))}
    </group>
  )
}

/** Robot sitting in its leather chair at the desk. Origin: floor under the chair. */
export default function Robot(props) {
  // seat top ≈ 0.83; desk back edge ≈ local z 0.55; desk top ≈ y 1.2
  return (
    <group {...props}>
      <TuftedChair />

      {/* pelvis + small torso with chest star */}
      <RoundedBox args={[0.4, 0.16, 0.32]} radius={0.07} smoothness={4} position={[0, 0.92, 0]}>
        <meshStandardMaterial {...SHELL} />
      </RoundedBox>
      <group position={[0, 1.2, -0.02]} rotation-x={-0.06}>
        <RoundedBox args={[0.46, 0.42, 0.34]} radius={0.14} smoothness={6}>
          <meshStandardMaterial {...SHELL} />
        </RoundedBox>
        <ChestStar position={[0, 0.03, 0.168]} scale={0.7} />
      </group>
      <mesh position={[0, 1.44, -0.03]}>
        <cylinderGeometry args={[0.07, 0.09, 0.1, 16]} />
        <meshStandardMaterial {...JOINT} />
      </mesh>

      {/* both hands on the laptop keyboard, typing */}
      <TypingArm side={1} phase={0} />
      <TypingArm side={-1} phase={1.7} />

      {/* legs: thighs on the seat, shins down under the desk, feet on the floor */}
      {[-0.12, 0.12].map((x) => (
        <group key={x}>
          <Limb a={[x, 0.9, 0.04]} b={[x, 0.88, 0.4]} c={[x, 0.2, 0.44]} r={0.065} />
          <Foot x={x} z={0.44} />
        </group>
      ))}

      <Head y={1.72} />
    </group>
  )
}
