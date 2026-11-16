/*
 * Synthesised cat sounds (Web Audio, no sound files):
 * a short "mi-aow" — sawtooth voice with a pitch glide and two sweeping
 * formant filters ("ee" → "ow") — followed by a soft purr
 * (low noise pulsed ~26 times per second).
 */

let ctx

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function meow(ac, t, out) {
  const voice = ac.createOscillator()
  voice.type = 'sawtooth'
  const base = 470 + Math.random() * 120
  voice.frequency.setValueAtTime(base, t)
  voice.frequency.linearRampToValueAtTime(base * 1.65, t + 0.17)
  voice.frequency.exponentialRampToValueAtTime(base * 0.82, t + 0.72)

  // a little vibrato
  const lfo = ac.createOscillator()
  const lfoGain = ac.createGain()
  lfo.frequency.value = 7
  lfoGain.gain.value = 14
  lfo.connect(lfoGain).connect(voice.frequency)

  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(0.55, t + 0.06)
  env.gain.setValueAtTime(0.5, t + 0.42)
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)

  for (const [from, to, q] of [
    [2100, 950, 7],
    [3000, 1500, 9],
  ]) {
    const f = ac.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = q
    f.frequency.setValueAtTime(from, t)
    f.frequency.linearRampToValueAtTime(from * 1.08, t + 0.15)
    f.frequency.exponentialRampToValueAtTime(to, t + 0.65)
    voice.connect(f).connect(env)
  }
  env.connect(out)
  voice.start(t)
  lfo.start(t)
  voice.stop(t + 0.85)
  lfo.stop(t + 0.85)
}

function purr(ac, t, out, dur = 1.8) {
  const len = Math.floor(ac.sampleRate * dur)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04 // brown noise
    d[i] = last * 3.5
  }
  const src = ac.createBufferSource()
  src.buffer = buf
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 380

  const pulse = ac.createGain()
  pulse.gain.value = 0.5 // LFO swings it 0 → 1
  const rate = ac.createOscillator()
  rate.frequency.value = 26
  const depth = ac.createGain()
  depth.gain.value = 0.5
  rate.connect(depth).connect(pulse.gain)

  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(0.9, t + 0.25)
  env.gain.setValueAtTime(0.9, t + dur - 0.5)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  src.connect(lp).connect(pulse).connect(env).connect(out)
  src.start(t)
  rate.start(t)
  src.stop(t + dur)
  rate.stop(t + dur)
}

/** Meow, then purr. Safe to call on every click. */
export function playCatSound() {
  try {
    const ac = audio()
    const out = ac.createGain()
    out.gain.value = 0.35
    out.connect(ac.destination)
    const t = ac.currentTime + 0.02
    meow(ac, t, out)
    purr(ac, t + 0.75, out)
  } catch {
    /* audio not available — the hearts still show */
  }
}
