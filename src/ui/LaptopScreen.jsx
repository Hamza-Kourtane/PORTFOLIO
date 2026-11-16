import { useEffect, useMemo, useState } from 'react'
import { PROJECTS } from '../config/content'
import { PROFILE } from '../config/profile'
import { useRoomStore } from '../store/useRoomStore'

/* ------------------------------------------------------------------ helpers */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return now
}

const ICONS = {
  pill: <path d="M8.5 15.5l7-7a3.5 3.5 0 0 1 5 5l-7 7a3.5 3.5 0 0 1-5-5zm3.5-3.5l5 5" />,
  nfc: (
    <>
      <path d="M6 8a6 6 0 0 1 0 8M9.5 6a9 9 0 0 1 0 12M13 4a12 12 0 0 1 0 16" />
      <circle cx="4" cy="12" r="1.2" />
    </>
  ),
  frame: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M7 16l3.5-4 3 3 2-2.5L18 16M9 8.5h.01" />
    </>
  ),
  doctor: (
    <>
      <path d="M6 3v5a4 4 0 0 0 8 0V3M10 12v3a4 4 0 0 0 8 0v-2" />
      <circle cx="18" cy="11" r="2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  cube: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18M4 7.5l8 4.5 8-4.5" />,
}

function Glyph({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

function AppIcon({ p, size = 'md' }) {
  return (
    <span className={`mac__icon mac__icon--${size}`} style={{ '--c': p.color }}>
      <Glyph name={p.icon} size={size === 'lg' ? 34 : size === 'dock' ? 24 : 17} />
    </span>
  )
}

/* ------------------------------------------------------------------ previews */
/** Drawn (CSS) previews for projects without screenshots. */
function Mock({ kind }) {
  if (kind === 'nfc')
    return (
      <div className="mk mk--nfc">
        <div className="mk-nfc__card">
          <span className="mk-nfc__waves">
            <i />
            <i />
            <i />
          </span>
          <b>TABLE 12</b>
          <small>Tap to order</small>
        </div>
        <div className="mk-phone">
          <div className="mk-phone__notch" />
          <p className="mk-phone__title">Menu · Table 12</p>
          {[
            ['Tajine poulet citron', '75'],
            ['Couscous royal', '90'],
            ['Pastilla au poulet', '65'],
            ['Thé à la menthe', '15'],
          ].map(([n, pr], i) => (
            <div key={n} className="mk-phone__row">
              <span className="mk-phone__dish" style={{ '--h': 20 + i * 18 }} />
              <span>
                <b>{n}</b>
                <small>{pr} DH</small>
              </span>
              <em>+</em>
            </div>
          ))}
          <div className="mk-phone__cta">Send order · 3 items</div>
        </div>
      </div>
    )
  if (kind === 'shop')
    return (
      <div className="mk mk--shop">
        <div className="mk-shop__bar">
          <b>POSTERS.ma</b>
          <span>Bestsellers</span>
          <span>New</span>
          <em>Cart · 2</em>
        </div>
        <div className="mk-shop__grid">
          {['#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#8e44ad', '#f4a261'].map((c, i) => (
            <div key={c} className="mk-shop__item">
              <div className="mk-shop__poster" style={{ '--a': c, '--r': `${i * 47}deg` }} />
              <small>Poster {String(i + 1).padStart(2, '0')}</small>
              <b>{[99, 129, 89, 149, 119, 99][i]} DH</b>
            </div>
          ))}
        </div>
      </div>
    )
  if (kind === 'booking')
    return (
      <div className="mk mk--booking">
        <div className="mk-bk__list">
          <p>Doctors near you</p>
          {['Cardiologist', 'Dermatologist', 'Pediatrician'].map((s, i) => (
            <div key={s} className={`mk-bk__doc ${i === 0 ? 'is-on' : ''}`}>
              <span className="mk-bk__avatar" />
              <span>
                <b>Dr. {['Amrani', 'Bennani', 'Idrissi'][i]}</b>
                <small>{s}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="mk-bk__cal">
          <p>Book an appointment</p>
          <div className="mk-bk__days">
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} className={i === 9 ? 'is-on' : i % 6 === 5 ? 'is-off' : ''}>
                {i + 4}
              </span>
            ))}
          </div>
          <div className="mk-bk__slots">
            {['09:00', '10:30', '14:00', '16:30'].map((t, i) => (
              <span key={t} className={i === 1 ? 'is-on' : ''}>
                {t}
              </span>
            ))}
          </div>
          <div className="mk-bk__chat">AI assistant: “Which specialist do you need?”</div>
        </div>
      </div>
    )
  if (kind === 'odoo')
    return (
      <div className="mk mk--odoo">
        <div className="mk-odoo__bar">
          <b>Odoo</b>
          <span>Discuss</span>
          <span>Activities</span>
        </div>
        <div className="mk-odoo__apps">
          {[
            ['Sales', '#e8875b'],
            ['Inventory', '#5b8ee8'],
            ['Invoicing', '#3fb58f'],
            ['CRM', '#d9668f'],
            ['Purchase', '#8d6be8'],
            ['Custom module', '#d4a850'],
          ].map(([n, c]) => (
            <div key={n} className="mk-odoo__app">
              <span style={{ background: c }} />
              <small>{n}</small>
            </div>
          ))}
        </div>
      </div>
    )
  return null
}

function Preview({ p }) {
  const imgs = p.preview?.images
  const [k, setK] = useState(0)
  useEffect(() => setK(0), [p.id])
  useEffect(() => {
    if (!imgs || imgs.length < 2) return
    const id = setInterval(() => setK((v) => (v + 1) % imgs.length), 4500)
    return () => clearInterval(id)
  }, [imgs])
  return (
    <figure className="mac__preview">
      <div className="mac__browser">
        <span className="mac__browser-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="mac__url">🔒 {p.url}</span>
      </div>
      <div className="mac__screen">
        {imgs ? imgs.map((src, i) => <img key={src} src={src} alt={p.preview.captions?.[i] ?? p.name} className={i === k ? 'is-on' : ''} loading="lazy" />) : <Mock kind={p.preview?.mock} />}
      </div>
      {imgs && (
        <figcaption>
          <span>{p.preview.captions?.[k]}</span>
          {imgs.length > 1 && (
            <span className="mac__thumbs">
              {imgs.map((src, i) => (
                <button key={src} className={i === k ? 'is-on' : ''} onClick={() => setK(i)} aria-label={`Screen ${i + 1}`}>
                  <img src={src} alt="" />
                </button>
              ))}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}

/* ------------------------------------------------------------------ screen */
/**
 * The laptop, full screen. Opens once the camera has flown into the 3D
 * laptop's screen: a lock screen that unlocks itself, then the desktop with
 * the Projects window (sidebar grouped by Work / Freelance / Studies / Personal,
 * a big live preview, details and stack) and a dock.
 */
export default function LaptopScreen() {
  const on = useRoomStore((s) => s.activeArea === 'projects')
  const backToRoom = useRoomStore((s) => s.backToRoom)
  const [open, setOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  // ?project=<id> opens the laptop on that project (handy for sharing a link)
  const [sel, setSel] = useState(() => {
    const want = new URLSearchParams(window.location.search).get('project')
    return PROJECTS.some((x) => x.id === want) ? want : PROJECTS[0].id
  })
  const [query, setQuery] = useState('')
  const now = useNow()

  useEffect(() => {
    if (!on) {
      setOpen(false)
      setUnlocked(false)
      return
    }
    const t1 = setTimeout(() => setOpen(true), 1300) // camera reaches the screen
    const t2 = setTimeout(() => setUnlocked(true), 2900) // lock screen slides away
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [on])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? PROJECTS.filter((x) => [x.name, x.context, x.tagline, ...x.stack].join(' ').toLowerCase().includes(q)) : PROJECTS
  }, [query])
  const groups = useMemo(() => [...new Set(list.map((x) => x.group))], [list])

  const i = PROJECTS.findIndex((x) => x.id === sel)
  const p = PROJECTS[i]
  const go = (d) => setSel(PROJECTS[(i + d + PROJECTS.length) % PROJECTS.length].id)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (!unlocked) return setUnlocked(true)
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={`mac ${open ? 'is-open' : ''} ${unlocked ? 'is-unlocked' : ''}`} aria-hidden={!open}>
      <div className="mac__wall" />

      {/* lock screen */}
      <div className="mac__lock" onClick={() => setUnlocked(true)}>
        <p className="mac__lock-date">{date}</p>
        <p className="mac__lock-time">{time}</p>
        <div className="mac__lock-user">
          <span className="mac__avatar">{PROFILE.initials}</span>
          <b>{PROFILE.name}</b>
          <small>Opening projects…</small>
        </div>
      </div>

      {/* menu bar */}
      <header className="mac__menubar">
        <span className="mac__logo" aria-hidden>
          ✦
        </span>
        <b>Projects</b>
        <span>File</span>
        <span>View</span>
        <span>Window</span>
        <span className="mac__spacer" />
        <svg className="mac__status" width="16" height="12" viewBox="0 0 16 12" aria-hidden>
          <path d="M8 11.5l2-2.4a2.8 2.8 0 0 0-4 0zM3.3 6.6a6.6 6.6 0 0 1 9.4 0l1.3-1.5a8.6 8.6 0 0 0-12 0zM.6 3.4a10.6 10.6 0 0 1 14.8 0L16.6 2a12.6 12.6 0 0 0-17.2 0z" fill="currentColor" />
        </svg>
        <svg className="mac__status" width="24" height="12" viewBox="0 0 24 12" aria-hidden>
          <rect x="0.5" y="0.5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.6" />
          <rect x="2" y="2" width="14" height="8" rx="1.6" fill="currentColor" />
          <rect x="21.5" y="4" width="1.8" height="4" rx="0.8" fill="currentColor" opacity="0.6" />
        </svg>
        <span>
          {now.toLocaleDateString(undefined, { weekday: 'short' })} {time}
        </span>
        <button className="mac__exit" onClick={backToRoom}>
          ← Back to the room
        </button>
      </header>

      {/* projects window */}
      <section className="mac__window" role="dialog" aria-label="Projects">
        <div className="mac__titlebar">
          <span className="dots">
            <i onClick={backToRoom} title="Close" />
            <i />
            <i />
          </span>
          <span className="mac__nav">
            <button onClick={() => go(-1)} aria-label="Previous project">
              ‹
            </button>
            <button onClick={() => go(1)} aria-label="Next project">
              ›
            </button>
          </span>
          <span className="mac__title">{p.name}</span>
          <label className="mac__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects, tech…" />
          </label>
        </div>

        <div className="mac__body">
          <aside className="mac__sidebar">
            {groups.map((g) => (
              <div key={g} className="mac__groupbox">
                <p className="mac__group">{g}</p>
                {list
                  .filter((x) => x.group === g)
                  .map((x) => (
                    <button key={x.id} className={x.id === sel ? 'is-active' : ''} onClick={() => setSel(x.id)}>
                      <AppIcon p={x} />
                      <span className="mac__item">
                        <b>{x.short}</b>
                        <small>{x.context}</small>
                      </span>
                    </button>
                  ))}
              </div>
            ))}
            {!list.length && <p className="mac__empty">No project matches “{query}”.</p>}
            <div className="mac__me">
              <span className="mac__avatar mac__avatar--sm">{PROFILE.initials}</span>
              <span>
                <b>{PROFILE.name}</b>
                <small>{PROFILE.role}</small>
              </span>
            </div>
          </aside>

          <article className="mac__detail" key={p.id} style={{ '--c': p.color }}>
            <Preview p={p} />

            <div className="mac__hero">
              <AppIcon p={p} size="lg" />
              <div>
                <div className="mac__chips">
                  <span className="mac__context">{p.context}</span>
                  <span className={`mac__status-chip ${p.status === 'In progress' ? 'is-live' : ''}`}>{p.status}</span>
                </div>
                <h2>{p.name}</h2>
                <p className="mac__tagline">{p.tagline}</p>
              </div>
            </div>

            <div className="mac__cols">
              <div>
                <p className="mac__text">{p.body}</p>
                <h4>What it does</h4>
                <ul className="mac__features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <aside className="mac__side">
                <h4>Built with</h4>
                <div className="mac__stack">
                  {p.stack.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <dl className="mac__facts">
                  <div>
                    <dt>Context</dt>
                    <dd>{p.context}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{p.group}</dd>
                  </div>
                  <div>
                    <dt>Features</dt>
                    <dd>{p.features.length}</dd>
                  </div>
                </dl>
                {p.link && (
                  <a className="mac__btn" href={p.link} target="_blank" rel="noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
                    </svg>
                    View the code
                  </a>
                )}
                <p className="mac__pager">
                  Project {i + 1} of {PROJECTS.length} · use ← →
                </p>
              </aside>
            </div>
          </article>
        </div>
      </section>

      {/* dock */}
      <nav className="mac__dock">
        {PROJECTS.map((x) => (
          <button key={x.id} className={x.id === sel ? 'is-active' : ''} onClick={() => setSel(x.id)} data-tip={x.short}>
            <AppIcon p={x} size="dock" />
          </button>
        ))}
        <span className="mac__dock-sep" />
        <button onClick={backToRoom} data-tip="Back to the room">
          <span className="mac__icon mac__icon--dock mac__icon--exit">⏏</span>
        </button>
      </nav>
    </div>
  )
}
