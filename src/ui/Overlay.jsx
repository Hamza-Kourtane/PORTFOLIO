import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { AREAS, AREAS_BY_ID } from '../config/areas'
import { PROFILE } from '../config/profile'
import { useRoomStore } from '../store/useRoomStore'
import Logo from './Logo'
import ContentPanel from './ContentPanel'
import ExperienceBook from './ExperienceBook'
import LaptopScreen from './LaptopScreen'

function Header() {
  const entered = useRoomStore((s) => s.entered)
  const activeArea = useRoomStore((s) => s.activeArea)
  const focusArea = useRoomStore((s) => s.focusArea)
  const backToRoom = useRoomStore((s) => s.backToRoom)
  return (
    <header className={`header ${entered ? 'is-visible' : ''}`}>
      <button className="brand" onClick={backToRoom} aria-label="Back to the room">
        <Logo />
        <span>
          <strong>{PROFILE.title}</strong>
          <small>
            {PROFILE.role} <i>/</i> {PROFILE.city}
          </small>
        </span>
      </button>
      <nav className="nav">
        {AREAS.map((a) => (
          <button key={a.id} className={activeArea === a.id ? 'is-active' : ''} onClick={() => focusArea(a.id)}>
            <em>{a.index}</em>
            {a.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

function Intro() {
  const { active, progress } = useProgress()
  const entered = useRoomStore((s) => s.entered)
  const enter = useRoomStore((s) => s.enter)
  const ready = !active
  return (
    <div className={`intro ${entered ? 'is-hidden' : ''}`}>
      <div className="intro__card">
        <Logo size={64} />
        <h1>{PROFILE.title}</h1>
        <p>
          {PROFILE.role} · {PROFILE.city}
        </p>
        <div className="intro__bar">
          <span style={{ width: `${ready ? 100 : progress}%` }} />
        </div>
        <button className="btn" disabled={!ready} onClick={enter}>
          {ready ? 'Enter the room' : 'Preparing the room…'}
        </button>
      </div>
    </div>
  )
}

function AreaHud() {
  const activeArea = useRoomStore((s) => s.activeArea)
  const backToRoom = useRoomStore((s) => s.backToRoom)
  const activeObject = useRoomStore((s) => s.activeObject)
  const closeObject = useRoomStore((s) => s.closeObject)
  const area = AREAS_BY_ID[activeArea]
  return (
    <div className={`area-hud ${area ? 'is-visible' : ''}`}>
      <button className="btn btn--ghost" onClick={activeObject ? closeObject : backToRoom}>
        <span aria-hidden>←</span> {activeObject ? `Back to ${area?.label ?? 'the area'}` : 'Back to the room'}
      </button>
      {area && !activeObject && activeArea === 'experience' && (
        <div className="area-card" key={area.id}>
          <em>{area.index}</em>
          <h2>{area.label}</h2>
          <p>{area.caption}</p>
          <small>{area.hint}</small>
        </div>
      )}
    </div>
  )
}

function Hint() {
  const entered = useRoomStore((s) => s.entered)
  const activeArea = useRoomStore((s) => s.activeArea)
  return (
    <div className={`hint ${entered && !activeArea ? 'is-visible' : ''}`}>
      Click a glowing area to explore
    </div>
  )
}

/** Dev helper: press R to overlay public/reference.png and compare framing. */
function ReferenceOverlay() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const onKey = (e) => e.key.toLowerCase() === 'r' && !e.repeat && setOn((v) => !v)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return on ? <img className="reference" src="/reference.png" alt="" /> : null
}

export default function Overlay() {
  useEffect(() => {
    // Esc: close the open object first, then leave the area
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useRoomStore.getState()
      if (s.activeObject) s.closeObject()
      else s.backToRoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Header />
      <AreaHud />
      <ContentPanel />
      <ExperienceBook />
      <LaptopScreen />
      <Hint />
      <Intro />
      {import.meta.env.DEV && <ReferenceOverlay />}
    </>
  )
}
