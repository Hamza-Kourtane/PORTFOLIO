import { useEffect, useRef, useState } from 'react'
import { EXPERIENCE } from '../config/content'
import { useRoomStore } from '../store/useRoomStore'

/** 8-point Moroccan star (khatam). */
function Emblem({ size = 54, className = 'xp__emblem' }) {
  const pts = Array.from({ length: 16 }, (_, k) => {
    const r = k % 2 ? 0.58 : 1
    const a = (k * Math.PI) / 8 - Math.PI / 2
    return `${(Math.cos(a) * r).toFixed(3)},${(Math.sin(a) * r).toFixed(3)}`
  }).join(' ')
  return (
    <svg className={className} width={size} height={size} viewBox="-1.1 -1.1 2.2 2.2" aria-hidden>
      <polygon points={pts} fill="none" stroke="currentColor" strokeWidth="0.07" />
      <circle r="0.26" fill="none" stroke="currentColor" strokeWidth="0.07" />
      <circle r="0.08" fill="currentColor" />
    </svg>
  )
}

/** Small ornamental divider: line · star · line. */
function Divider() {
  return (
    <svg className="xp__divider" viewBox="0 0 200 14" aria-hidden>
      <path d="M0 7H84M116 7H200" stroke="currentColor" strokeWidth="1" />
      <path d="M100 0L104 7L100 14L96 7Z M88 7l3-2.5 3 2.5-3 2.5Z M106 7l3-2.5 3 2.5-3 2.5Z" fill="currentColor" />
    </svg>
  )
}

/** Round gold stamp with the company name around the rim. */
function Seal({ text, id }) {
  return (
    <svg className="xp__seal" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <path id={`seal-${id}`} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
      <text fontSize="11" letterSpacing="3" fill="currentColor">
        <textPath href={`#seal-${id}`}>{`✦ ${text.toUpperCase()} ✦ ${text.toUpperCase()} `}</textPath>
      </text>
      <text x="60" y="71" textAnchor="middle" fontSize="30" fontWeight="700" fill="currentColor" fontFamily="Cormorant Garamond, Georgia, serif">
        {text[0]}
      </text>
    </svg>
  )
}

// dev only: ?bookphase=arrive keeps the book closed (to check the cover)
const HOLD = import.meta.env.DEV && new URLSearchParams(window.location.search).get('bookphase')

// dev only: ?notransition shows the final state of each step immediately (for screenshots)
if (import.meta.env.DEV && typeof document !== 'undefined' && window.location.search.includes('notransition')) {
  const st = document.createElement('style')
  st.textContent = '.xp, .xp * { transition: none !important; animation: none !important }'
  document.head.appendChild(st)
}

const CORNERS = ['tl', 'tr', 'bl', 'br']

/**
 * Full-screen open book for one job.
 * hidden → arrive (closed book, cover facing you) → open (cover swings open,
 * pages and ribbon appear). Next / previous turns a page. Closing shuts the
 * cover before the 3D book flies back to the shelf.
 */
export default function ExperienceBook() {
  const activeObject = useRoomStore((s) => s.activeObject)
  const openObject = useRoomStore((s) => s.openObject)
  const closeObject = useRoomStore((s) => s.closeObject)
  const index = EXPERIENCE.findIndex((e) => e.id === activeObject)
  const job = EXPERIENCE[index]

  const [shown, setShown] = useState(null)
  const [phase, setPhase] = useState('hidden') // hidden | arrive | open
  const [turn, setTurn] = useState(null) // { dir, key } while a page is turning
  const timers = useRef([])
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!job) {
      setPhase('hidden')
      return
    }
    setShown(job)
    if (phase !== 'hidden') return // chapter change while the book is open
    const t1 = setTimeout(() => setPhase('arrive'), 950) // 3D book slides out and flies in first
    const t2 = HOLD === 'arrive' ? 0 : setTimeout(() => setPhase('open'), 1650)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [job?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    if (phase !== 'open') return closeObject()
    setPhase('arrive') // cover closes…
    later(() => closeObject(), 700) // …then the book flies back to the shelf
  }

  const goTo = (target) => {
    if (turn || phase !== 'open' || target === index) return
    const n = EXPERIENCE.length
    const dir = (target - index + n) % n <= n / 2 ? 'next' : 'prev'
    setTurn({ dir, key: Date.now() })
    later(() => openObject(EXPERIENCE[target].id, null), 380) // swap content under the turning leaf
    later(() => setTurn(null), 850)
  }
  const go = (d) => goTo((index + d + EXPERIENCE.length) % EXPERIENCE.length)

  useEffect(() => {
    if (phase === 'hidden') return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation() // handled here so the cover closes first
        close()
      }
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  const j = shown
  const no = j ? EXPERIENCE.findIndex((e) => e.id === j.id) + 1 : 1
  const chapter = String(no).padStart(2, '0')

  return (
    <div className={`xp is-${phase}`} aria-hidden={phase === 'hidden'} onClick={close}>
      {j && (
        <div className="xp__stage" style={{ '--leather': j.color }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${j.company} — ${j.role}`}>
          <div className="xp__book">
            <div className="xp__board xp__board--left" />
            <div className="xp__board xp__board--right" />

            <div className="xp__block xp__block--left">
              <section className="xp__page xp__page--left">
                <div className="xp__content" key={'l' + j.id}>
                  <p className="xp__eyebrow">
                    Chapter {chapter} · {j.type}
                  </p>
                  <Emblem />
                  <h2 className="xp__company">{j.company}</h2>
                  <p className="xp__role">{j.role}</p>
                  <dl className="xp__meta">
                    <div>
                      <dt>Period</dt>
                      <dd>{j.period}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{j.duration}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{j.location}</dd>
                    </div>
                  </dl>
                  <p className="xp__summary">{j.summary}</p>
                </div>
                <span className="xp__folio">— {no * 2 - 1} —</span>
              </section>
            </div>

            <div className="xp__block xp__block--right">
              <section className="xp__page xp__page--right">
                <div className="xp__content" key={'r' + j.id}>
                  <h3>What I did</h3>
                  <ol className="xp__tasks">
                    {j.tasks.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                  <Divider />
                  <h3>Tools &amp; stack</h3>
                  <div className="xp__stack">
                    {j.stack.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                  <blockquote className="xp__takeaway">{j.takeaway}</blockquote>
                  <Seal text={j.company} id={j.id} />
                </div>
                <span className="xp__folio">— {no * 2} —</span>
              </section>
            </div>

            <span className="xp__ribbon" aria-hidden />

            {turn && (
              <div key={turn.key} className={`xp__leaf xp__leaf--${turn.dir}`} aria-hidden>
                <i className="xp__leaf-front" />
                <i className="xp__leaf-back" />
              </div>
            )}

            {/* front cover: hinged at the spine */}
            <div className="xp__cover" aria-hidden>
              <div className="xp__cover-front">
                {CORNERS.map((c) => (
                  <Emblem key={c} size={26} className={`xp__corner xp__corner--${c}`} />
                ))}
                <p className="xp__cover-chapter">Chapter {chapter}</p>
                <Emblem size={104} className="xp__cover-emblem" />
                <h2>{j.company}</h2>
                <Divider />
                <p className="xp__cover-role">{j.role}</p>
              </div>
              <div className="xp__cover-back" />
            </div>
          </div>

          <button className="xp__close" onClick={close} aria-label="Close the book">
            ×
          </button>
          <nav className="xp__nav">
            <button onClick={() => go(-1)} aria-label="Previous job">
              ‹ Previous
            </button>
            <span className="xp__dots">
              {EXPERIENCE.map((e, i) => (
                <i key={e.id} className={e.id === j.id ? 'is-active' : ''} style={{ '--dot': e.color }} onClick={() => goTo(i)} title={e.company} />
              ))}
            </span>
            <button onClick={() => go(1)} aria-label="Next job">
              Next ›
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
