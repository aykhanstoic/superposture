// Tiny synthesized UI sounds via Web Audio — no bundled asset, no network.

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * A bright, clearly audible tick — instant feedback the moment posture
 * drops. Two layers: a crisp high "tick" transient and a lower body tone
 * that keeps it from sounding thin on laptop speakers.
 */
export function playSlouchTick(): void {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.45, t + 0.004);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  master.connect(ctx.destination);

  // Crisp attack: bright square, falling slightly like a woodblock.
  const tick = ctx.createOscillator();
  tick.type = "square";
  tick.frequency.setValueAtTime(1680, t);
  tick.frequency.exponentialRampToValueAtTime(1180, t + 0.1);
  const tickGain = ctx.createGain();
  tickGain.gain.value = 0.55;
  tick.connect(tickGain).connect(master);

  // Body: sine an octave-ish below, so small speakers still carry it.
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(840, t);
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.9;
  body.connect(bodyGain).connect(master);

  tick.start(t);
  body.start(t);
  tick.stop(t + 0.18);
  body.stop(t + 0.18);
}
