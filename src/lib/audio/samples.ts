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

function voiceNote(
  ctx: AudioContext,
  out: AudioNode,
  opts: {
    type: OscillatorType;
    freqs: number[];
    time: number;
    dur: number;
    peak: number;
    attack?: number;
    cutoff?: number;
    cutoffEnd?: number;
    q?: number;
    detune?: number;
    glideTo?: number;
  },
) {
  const { type, freqs, time, dur, peak } = opts;
  const attack = opts.attack ?? 0.008;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.setValueAtTime(opts.q ?? 1, time);
  filter.frequency.setValueAtTime(opts.cutoff ?? 8000, time);
  if (opts.cutoffEnd) filter.frequency.exponentialRampToValueAtTime(opts.cutoffEnd, time + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  filter.connect(gain);
  gain.connect(out);
  for (const freq of freqs) {
    for (const cents of opts.detune ? [-opts.detune, opts.detune] : [0]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      if (opts.glideTo) osc.frequency.exponentialRampToValueAtTime(opts.glideTo * (freq / freqs[0]), time + dur * 0.6);
      osc.detune.setValueAtTime(cents, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.03);
    }
  }
  return { filter, gain };
}

function vowel(ctx: AudioContext, out: AudioNode, time: number, f0: number, formants: number[], dur: number, peak: number) {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(f0, time);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.8, time + dur);
  const vib = ctx.createOscillator();
  const vibGain = ctx.createGain();
  vib.frequency.value = 5.5;
  vibGain.gain.value = f0 * 0.015;
  vib.connect(vibGain);
  vibGain.connect(osc.frequency);
  const mix = ctx.createGain();
  mix.gain.setValueAtTime(0.0001, time);
  mix.gain.exponentialRampToValueAtTime(peak, time + 0.03);
  mix.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  formants.forEach((freq, index) => {
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(freq, time);
    band.Q.setValueAtTime(9, time);
    const level = ctx.createGain();
    level.gain.value = index === 0 ? 1 : 0.6;
    osc.connect(band);
    band.connect(level);
    level.connect(mix);
  });
  mix.connect(out);
  osc.start(time);
  vib.start(time);
  osc.stop(time + dur + 0.03);
  vib.stop(time + dur + 0.03);
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
    case "kick808": {
      pitch(ctx, out, "sine", 120, 38, time, 0.7, 0.95);
      break;
    }
    case "kickpunch": {
      pitch(ctx, out, "sine", 180, 50, time, 0.22, 0.95);
      pitch(ctx, out, "square", 900, 200, time, 0.012, 0.2);
      break;
    }
    case "snare2": {
      noiseHit(ctx, noise, out, time, 0.2, 0.45, 1500);
      pitch(ctx, out, "triangle", 240, 160, time, 0.09, 0.4);
      break;
    }
    case "openhat": {
      noiseHit(ctx, noise, out, time, 0.38, 0.26, 7000);
      break;
    }
    case "crash": {
      noiseHit(ctx, noise, out, time, 1.4, 0.3, 4200);
      noiseHit(ctx, noise, out, time, 0.6, 0.18, 9000);
      break;
    }
    case "bongo": {
      pitch(ctx, out, "sine", 420, 300, time, 0.12, 0.55);
      break;
    }
    case "clave": {
      pitch(ctx, out, "sine", 2500, 2400, time, 0.05, 0.4);
      break;
    }
    case "tambo": {
      for (const delay of [0, 0.03, 0.06]) noiseHit(ctx, noise, out, time + delay, 0.09, 0.2, 8000);
      pitch(ctx, out, "square", 5200, 5000, time, 0.08, 0.04);
      break;
    }
    case "wood": {
      pitch(ctx, out, "triangle", 1100, 900, time, 0.06, 0.45);
      break;
    }
    case "triangle": {
      for (const freq of [2600, 4140, 6300]) pitch(ctx, out, "sine", freq, freq, time, 0.9, 0.08);
      break;
    }
    case "sub": {
      voiceNote(ctx, out, { type: "sine", freqs: [49], time, dur: 0.6, peak: 0.8 });
      break;
    }
    case "acid": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [65.4], time, dur: 0.3, peak: 0.4, cutoff: 2600, cutoffEnd: 180, q: 14 });
      break;
    }
    case "reese": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [55], time, dur: 0.55, peak: 0.35, cutoff: 700, detune: 18 });
      break;
    }
    case "pluckbass": {
      voiceNote(ctx, out, { type: "square", freqs: [73.4], time, dur: 0.22, peak: 0.4, cutoff: 1800, cutoffEnd: 120, q: 3 });
      break;
    }
    case "wobble": {
      const { filter } = voiceNote(ctx, out, { type: "sawtooth", freqs: [55], time, dur: 0.7, peak: 0.4, cutoff: 500, q: 8, detune: 8 });
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 6;
      depth.gain.value = 420;
      lfo.connect(depth);
      depth.connect(filter.frequency);
      lfo.start(time);
      lfo.stop(time + 0.75);
      break;
    }
    case "octbass": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [55, 110], time, dur: 0.3, peak: 0.3, cutoff: 1400, cutoffEnd: 300 });
      break;
    }
    case "slide": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [110], time, dur: 0.45, peak: 0.35, cutoff: 1200, glideTo: 41 });
      break;
    }
    case "fmbass": {
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.value = 130.8;
      modGain.gain.setValueAtTime(300, time);
      modGain.gain.exponentialRampToValueAtTime(1, time + 0.3);
      mod.connect(modGain);
      const carrier = ctx.createOscillator();
      carrier.frequency.value = 65.4;
      modGain.connect(carrier.frequency);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
      carrier.connect(gain);
      gain.connect(out);
      mod.start(time);
      carrier.start(time);
      mod.stop(time + 0.42);
      carrier.stop(time + 0.42);
      break;
    }
    case "minor": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [220, 261.6, 329.6], time, dur: 0.5, peak: 0.2, cutoff: 2400, cutoffEnd: 600, detune: 6 });
      break;
    }
    case "major": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [261.6, 329.6, 392], time, dur: 0.5, peak: 0.2, cutoff: 2400, cutoffEnd: 600, detune: 6 });
      break;
    }
    case "pluck": {
      voiceNote(ctx, out, { type: "triangle", freqs: [523.3], time, dur: 0.3, peak: 0.4, cutoff: 5000, cutoffEnd: 400 });
      break;
    }
    case "lead": {
      voiceNote(ctx, out, { type: "square", freqs: [440], time, dur: 0.45, peak: 0.22, cutoff: 3000, detune: 10 });
      break;
    }
    case "pad": {
      voiceNote(ctx, out, { type: "sawtooth", freqs: [174.6, 220, 261.6, 329.6], time, dur: 1.6, peak: 0.12, attack: 0.35, cutoff: 1400, detune: 14 });
      break;
    }
    case "arp": {
      [261.6, 329.6, 392, 523.3].forEach((freq, index) => {
        voiceNote(ctx, out, { type: "square", freqs: [freq], time: time + index * 0.07, dur: 0.1, peak: 0.18, cutoff: 3500 });
      });
      break;
    }
    case "bell": {
      for (const [freq, peak] of [[880, 0.3], [2420, 0.12], [3520, 0.06]] as const) {
        pitch(ctx, out, "sine", freq, freq, time, 1.1, peak);
      }
      break;
    }
    case "riser": {
      pitch(ctx, out, "sawtooth", 120, 1800, time, 0.9, 0.16);
      noiseHit(ctx, noise, out, time + 0.3, 0.6, 0.12, 3000);
      break;
    }
    case "sweep": {
      const source = ctx.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 6;
      band.frequency.setValueAtTime(300, time);
      band.frequency.exponentialRampToValueAtTime(9000, time + 0.8);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.5, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.85);
      source.connect(band);
      band.connect(gain);
      gain.connect(out);
      source.start(time);
      source.stop(time + 0.9);
      break;
    }
    case "blip": {
      pitch(ctx, out, "square", 1320, 1320, time, 0.06, 0.18);
      pitch(ctx, out, "square", 1980, 1980, time + 0.06, 0.06, 0.15);
      break;
    }
    case "glitch": {
      for (let i = 0; i < 6; i++) {
        const t = time + i * 0.028;
        if (i % 2) noiseHit(ctx, noise, out, t, 0.02, 0.25, 2500);
        else pitch(ctx, out, "square", 300 + i * 420, 200 + i * 300, t, 0.022, 0.18);
      }
      break;
    }
    case "voxe": {
      vowel(ctx, out, time, 220, [530, 1840, 2480], 0.35, 0.4);
      break;
    }
    case "voxo": {
      vowel(ctx, out, time, 196, [500, 900, 2400], 0.35, 0.4);
      break;
    }
    case "voxi": {
      vowel(ctx, out, time, 262, [300, 2300, 3000], 0.35, 0.35);
      break;
    }
    case "hey": {
      noiseHit(ctx, noise, out, time, 0.05, 0.2, 2000);
      vowel(ctx, out, time + 0.03, 240, [660, 1700, 2400], 0.22, 0.5);
      break;
    }
    case "choir": {
      for (const f0 of [196, 247, 294]) vowel(ctx, out, time, f0, [700, 1150, 2600], 1.2, 0.18);
      break;
    }
    case "uh": {
      vowel(ctx, out, time, 150, [640, 1190, 2390], 0.25, 0.45);
      break;
    }
    case "beatbox": {
      pitch(ctx, out, "sine", 140, 45, time, 0.16, 0.9);
      noiseHit(ctx, noise, out, time + 0.12, 0.08, 0.3, 5000);
      noiseHit(ctx, noise, out, time + 0.24, 0.12, 0.35, 1500);
      break;
    }
    default:
      break;
  }
}
