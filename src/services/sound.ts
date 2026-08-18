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
 * A soft, short woodblock-style tick — instant feedback the moment posture
 * drops, deliberately quieter and quicker than the reminder notification.
 */
export function playSlouchTick(): void {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(1250, t);
  osc.frequency.exponentialRampToValueAtTime(700, t + 0.05);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.15, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.09);
}
