import { useEffect, useState } from 'react'
import { ABOUT, CONTACT } from '../config/content'
import { useRoomStore } from '../store/useRoomStore'

/** Which panel to show for the current selection. */
function resolve(activeArea, activeObject) {
  if (activeArea === 'contact') return { kind: 'contact' }
  // projects open full screen on the laptop (LaptopScreen)
  if (activeArea === 'projects') return null
  if (!activeObject) return null
  if (activeObject === 'about' || activeObject === 'about-globe') return { kind: 'about' }
  // experience books open full screen (ExperienceBook), not in this panel
  return null
}

function About() {
  return (
    <>
      <h3>{ABOUT.title}</h3>
      {ABOUT.body.map((t) => (
        <p key={t}>{t}</p>
      ))}
      {Object.entries(ABOUT.skills).map(([k, list]) => (
        <div key={k} className="chips">
          <span className="eyebrow">{k}</span>
          {list.map((s) => (
            <em key={s}>{s}</em>
          ))}
        </div>
      ))}
    </>
  )
}

function Contact() {
  return (
    <>
      <h3>Let's talk</h3>
      <p>Open to AI engineering roles and interesting collaborations.</p>
      <div className="links">
        {CONTACT.links.map((l) => (
          <a key={l.label} className="link" href={l.href} target="_blank" rel="noreferrer">
            {l.label} →
          </a>
        ))}
      </div>
    </>
  )
}

const TITLES = { projects: 'projects.app', experience: 'experience.log', about: 'about.md', contact: 'contact.sh' }

/** Window-style content panel (title bar + body), slides in from the right. */
export default function ContentPanel() {
  const activeArea = useRoomStore((s) => s.activeArea)
  const activeObject = useRoomStore((s) => s.activeObject)
  const closeObject = useRoomStore((s) => s.closeObject)
  const backToRoom = useRoomStore((s) => s.backToRoom)
  const view = resolve(activeArea, activeObject)

  // keep the last view mounted while sliding out
  const [shown, setShown] = useState(view)
  useEffect(() => {
    if (view) setShown(view)
  }, [activeArea, activeObject]) // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => (activeArea === 'contact' || activeArea === 'projects' ? backToRoom() : closeObject())
  const v = view ?? shown
  return (
    <aside className={`panel ${view ? 'is-open' : ''}`} aria-hidden={!view}>
      {v && (
        <>
          <header className="panel__bar">
            <span className="dots">
              <i onClick={close} />
              <i />
              <i />
            </span>
            <span className="panel__title">{TITLES[v.kind]}</span>
            <button className="panel__close" onClick={close} aria-label="Close">
              ×
            </button>
          </header>
          <div className="panel__body" key={v.kind + (v.exp?.id ?? '')}>
            {v.kind === 'about' && <About />}
            {v.kind === 'contact' && <Contact />}
          </div>
        </>
      )}
    </aside>
  )
}
