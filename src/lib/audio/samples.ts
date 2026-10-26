import type { SampleId } from "@/lib/groove/pattern";

function noiseHit(
  ctx: AudioContext,
  noise: AudioBuffer,
  out: AudioNode,
  time: number,
  dur: number,
  peak: number,
  highpass: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(highpass, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  source.start(time, Math.random() * 0.45);
  source.stop(time + dur + 0.02);
}

function pitch(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  from: number,
  to: number,
  time: number,
  dur: number,
  peak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, time);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), time + dur);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + Math.min(0.012, dur * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(time);
  osc.stop(time + dur + 0.03);
  return osc;
}

export function triggerSample(
  ctx: AudioContext,
  noise: AudioBuffer,
  out: AudioNode,
  id: SampleId,
  time: number,
) {
  switch (id) {
    case "clap": {
      for (const delay of [0, 0.011, 0.023]) {
        noiseHit(ctx, noise, out, time + delay, 0.11, delay === 0 ? 0.42 : 0.28, 900);
      }
      pitch(ctx, out, "triangle", 420, 180, time, 0.04, 0.16);
      break;
    }
    case "rim": {
      pitch(ctx, out, "square", 980, 420, time, 0.028, 0.28);
      pitch(ctx, out, "triangle", 460, 320, time, 0.05, 0.22);
      break;
    }
    case "tom": {
      pitch(ctx, out, "sine", 196, 78, time, 0.28, 0.7);
      noiseHit(ctx, noise, out, time, 0.03, 0.16, 400);
      break;
    }
    case "cowbell": {
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.setValueAtTime(1200, time);
      band.Q.setValueAtTime(4, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
      band.connect(gain);
      gain.connect(out);
      for (const freq of [560, 845]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(band);
        osc.start(time);
        osc.stop(time + 0.25);
      }
      break;
    }
    case "shaker": {
      noiseHit(ctx, noise, out, time, 0.045, 0.32, 6500);
      noiseHit(ctx, noise, out, time + 0.05, 0.03, 0.18, 7200);
      break;
    }
    case "conga": {
      pitch(ctx, out, "sine", 280, 168, time, 0.18, 0.62);
      noiseHit(ctx, noise, out, time, 0.02, 0.14, 800);
      break;
    }
    case "laser": {
      pitch(ctx, out, "sawtooth", 1760, 90, time, 0.32, 0.22);
      break;
    }
    case "zap": {
      pitch(ctx, out, "square", 1400, 70, time, 0.1, 0.2);
      noiseHit(ctx, noise, out, time, 0.06, 0.24, 1800);
      break;
    }
    case "stab": {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.setValueAtTime(6, time);
      filter.frequency.setValueAtTime(2200, time);
      filter.frequency.exponentialRampToValueAtTime(280, time + 0.22);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.28, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
      filter.connect(gain);
      gain.connect(out);
      for (const freq of [196, 247, 294]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(filter);
        osc.start(time);
        osc.stop(time + 0.28);
      }
      break;
    }
    case "voice": {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(196, time);
      osc.frequency.exponentialRampToValueAtTime(150, time + 0.22);
      const mix = ctx.createGain();
      mix.gain.setValueAtTime(0.0001, time);
      mix.gain.exponentialRampToValueAtTime(0.34, time + 0.02);
      mix.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
      for (const freq of [700, 1220]) {
        const formant = ctx.createBiquadFilter();
        formant.type = "bandpass";
        formant.frequency.setValueAtTime(freq, time);
        formant.Q.setValueAtTime(8, time);
        const level = ctx.createGain();
        level.gain.value = 0.7;
        osc.connect(formant);
        formant.connect(level);
        level.connect(mix);
      }
      mix.connect(out);
      osc.start(time);
      osc.stop(time + 0.3);
      break;
    }
    case "siren": {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, time);
      osc.frequency.linearRampToValueAtTime(980, time + 0.16);
      osc.frequency.linearRampToValueAtTime(540, time + 0.34);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.28, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
      osc.connect(gain);
      gain.connect(out);
      osc.start(time);
      osc.stop(time + 0.44);
      break;
    }
    case "fall": {
      pitch(ctx, out, "sine", 740, 48, time, 0.55, 0.4);
      noiseHit(ctx, noise, out, time, 0.28, 0.16, 500);
      break;
    }
    default:
      break;
  }
}
