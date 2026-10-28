import {
  BANK_IDS,
  CHANNEL_IDS,
  SAMPLES,
  SAMPLE_IDS,
  type BankId,
  type ChannelId,
  type GrooveState,
  type SampleId,
} from "@/lib/groove/pattern";

const SAMPLE_BANK = Object.fromEntries(SAMPLES.map((sample) => [sample.id, sample.bank])) as Record<SampleId, BankId>;
import { triggerSample as synthSample } from "@/lib/audio/samples";
import { concatFloats, decodeToWav, encodeWav } from "@/lib/audio/wav";

const WORKLET = `
class VoltaCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pending = [];
    this.count = 0;
    this.stopped = false;
    this.port.onmessage = () => {
      this.stopped = true;
      this.flush(true);
    };
  }
  flush(done) {
    const samples = new Float32Array(this.count);
    let offset = 0;
    for (const chunk of this.pending) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    this.pending = [];
    this.count = 0;
    this.port.postMessage({ done: done, samples: samples }, [samples.buffer]);
  }
  process(inputs) {
    if (this.stopped) return true;
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      const copy = new Float32Array(channel);
      this.pending.push(copy);
      this.count += copy.length;
      if (this.count >= 24000) this.flush(false);
    }
    return true;
  }
}
registerProcessor("volta-capture", VoltaCapture);
`;

export type RecordingFile = {
  blob: Blob;
  extension: "wav" | "webm" | "ogg";
};

type Scheduled = { step: number; time: number };

export class GrooveEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noise: AudioBuffer | null = null;
  private bus: Partial<Record<ChannelId, GainNode>> = {};
  private sampleBus: GainNode | null = null;
  private bankBus: Partial<Record<BankId, GainNode>> = {};
  private spectrum = new Uint8Array(64);
  private state: GrooveState | null = null;
  private playing = false;
  private heldStep = 0;
  private scheduleIndex = 0;
  private nextNoteTime = 0;
  private timer: number | null = null;
  private events: Scheduled[] = [];
  private recording = false;
  private recordStartedAt = 0;
  private recorderMode: "worklet" | "media" | null = null;
  private workletReady = false;
  private workletNode: AudioWorkletNode | null = null;
  private workletMute: GainNode | null = null;
  private pcm: Float32Array[] = [];
  private captureDone: (() => void) | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaChunks: Blob[] = [];

  sync(state: GrooveState) {
    this.state = state;
    this.applyMix();
  }

  isPlaying() {
    return this.playing;
  }

  isRecording() {
    return this.recording;
  }

  recordingElapsed() {
    if (!this.recording || !this.ctx) return 0;
    return Math.max(0, this.ctx.currentTime - this.recordStartedAt);
  }

  getPlayhead() {
    if (!this.playing || !this.ctx) return this.heldStep;
    const now = this.ctx.currentTime;
    let step = this.heldStep;
    for (const event of this.events) {
      if (event.time <= now) step = event.step;
    }
    return step;
  }

  /** Step nearest to "now" while playing — used to quantize live pad hits into the loop. */
  getNearestStep() {
    if (!this.playing || !this.ctx) return this.heldStep;
    const now = this.ctx.currentTime;
    const half = this.stepDuration() / 2;
    let best = this.getPlayhead();
    let bestDist = Infinity;
    for (const event of this.events) {
      const dist = Math.abs(event.time - now);
      if (dist < bestDist && event.time - now < half) {
        bestDist = dist;
        best = event.step;
      }
    }
    return best;
  }

  async playSample(id: SampleId) {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    this.triggerSample(id, ctx.currentTime);
  }

  readSpectrum(): Uint8Array | null {
    if (!this.analyser) return null;
    if (this.spectrum.length !== this.analyser.frequencyBinCount) {
      this.spectrum = new Uint8Array(this.analyser.frequencyBinCount);
    }
    this.analyser.getByteFrequencyData(this.spectrum);
    return this.spectrum;
  }

  async play() {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (this.playing) return;
    this.armScheduler();
  }

  pause() {
    if (!this.playing) return;
    this.heldStep = this.getPlayhead();
    this.scheduleIndex = (this.heldStep + 1) % 16;
    this.playing = false;
    this.events = [];
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  async startRecording() {
    if (this.recording) return;
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (!this.playing) this.armScheduler();
    await this.attachRecorder();
  }

  async stopRecording(): Promise<RecordingFile> {
    if (!this.recording || !this.ctx) throw new Error("No hay una grabación en curso.");
    this.recording = false;
    try {
      if (this.recorderMode === "worklet") {
        const done = new Promise<void>((resolve) => {
          this.captureDone = resolve;
        });
        this.workletNode?.port.postMessage("stop");
        await Promise.race([done, new Promise<void>((resolve) => window.setTimeout(resolve, 1200))]);
        this.captureDone = null;
        this.detachWorklet();
        const pcm = concatFloats(this.pcm);
        this.pcm = [];
        if (pcm.length < 32) throw new Error("La toma está vacía. Deja sonar el patrón un momento.");
        return { blob: encodeWav(pcm, this.ctx.sampleRate), extension: "wav" };
      }
      const blob = await this.finishMediaRecorder();
      try {
        return { blob: await decodeToWav(this.ctx, blob), extension: "wav" };
      } catch {
        const extension = blob.type.includes("ogg") ? "ogg" : "webm";
        return { blob, extension };
      }
    } finally {
      this.recording = false;
      this.recorderMode = null;
    }
  }

  dispose() {
    this.playing = false;
    this.recording = false;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.detachWorklet();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    void this.ctx?.close();
    this.ctx = null;
    this.bankBus = {};
  }

  private ensureContext() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 12;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    const master = ctx.createGain();
    master.gain.value = this.state?.master ?? 0.82;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.72;
    compressor.connect(master);
    master.connect(ctx.destination);
    master.connect(analyser);
    this.ctx = ctx;
    this.compressor = compressor;
    this.master = master;
    this.analyser = analyser;
    this.spectrum = new Uint8Array(analyser.frequencyBinCount);
    this.noise = this.makeNoise(ctx);
    for (const id of CHANNEL_IDS) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(compressor);
      this.bus[id] = gain;
    }
    const sampleBus = ctx.createGain();
    sampleBus.gain.value = 0.9;
    sampleBus.connect(compressor);
    this.sampleBus = sampleBus;
    for (const id of BANK_IDS) {
      const gain = ctx.createGain();
      gain.gain.value = 0.8;
      gain.connect(sampleBus);
      this.bankBus[id] = gain;
    }
    this.applyMix();
    return ctx;
  }

  private makeNoise(ctx: AudioContext) {
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private applyMix() {
    if (!this.ctx || !this.master || !this.state) return;
    const anySolo = CHANNEL_IDS.some((id) => this.state?.lanes[id].solo);
    const now = this.ctx.currentTime;
    for (const id of CHANNEL_IDS) {
      const lane = this.state.lanes[id];
      const audible = !lane.mute && (!anySolo || lane.solo);
      this.bus[id]?.gain.setTargetAtTime(audible ? lane.volume : 0, now, 0.012);
    }
    this.master.gain.setTargetAtTime(this.state.master, now, 0.012);
    this.sampleBus?.gain.setTargetAtTime(this.state.sampleVol ?? 0.9, now, 0.012);
    for (const id of BANK_IDS) {
      this.bankBus[id]?.gain.setTargetAtTime(this.state.bankVol?.[id] ?? 0.8, now, 0.012);
    }
  }

  private stepDuration() {
    const bpm = Math.min(180, Math.max(60, this.state?.bpm ?? 120));
    return 60 / bpm / 4;
  }

  private armScheduler() {
    if (!this.ctx || this.playing) return;
    this.events = [];
    this.scheduleIndex = this.heldStep;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.playing = true;
    this.tick();
  }

  private tick = () => {
    if (!this.playing || !this.ctx) return;
    const horizon = this.ctx.currentTime + 0.12;
    while (this.nextNoteTime < horizon) {
      this.fire(this.scheduleIndex, this.nextNoteTime);
      this.events.push({ step: this.scheduleIndex, time: this.nextNoteTime });
      this.nextNoteTime += this.stepDuration();
      this.scheduleIndex = (this.scheduleIndex + 1) % 16;
    }
    const now = this.ctx.currentTime;
    if (this.events.length > 24) this.events = this.events.filter((event) => event.time > now - 0.4);
    this.timer = window.setTimeout(this.tick, 25);
  };

  private fire(step: number, time: number) {
    const state = this.state;
    if (!state) return;
    if (state.steps.kick[step]) this.triggerKick(time, state.lanes.kick.decay);
    if (state.steps.snare[step]) this.triggerSnare(time, state.lanes.snare.decay);
    if (state.steps.hat[step]) this.triggerHat(time, state.lanes.hat.decay);
    if (state.steps.bass[step]) this.triggerBass(time, state.lanes.bass.decay, state.bass[step] ?? 40);
    if (!state.samples) return;
    for (const id of SAMPLE_IDS) {
      if (state.samples[id]?.[step]) this.triggerSample(id, time);
    }
  }

  private triggerSample(id: SampleId, time: number) {
    if (!this.ctx || !this.noise || !this.sampleBus) return;
    const out = this.bankBus[SAMPLE_BANK[id]] ?? this.sampleBus;
    synthSample(this.ctx, this.noise, out, id, time);
  }

  private triggerKick(time: number, decay: number) {
    const ctx = this.ctx;
    const out = this.bus.kick;
    if (!ctx || !out) return;
    const dur = 0.1 + decay * 0.48;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(168, time);
    osc.frequency.exponentialRampToValueAtTime(54, time + 0.055);
    osc.frequency.exponentialRampToValueAtTime(42, time + dur);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.9, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start(time);
    osc.stop(time + dur + 0.02);

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "square";
    click.frequency.setValueAtTime(920, time);
    click.frequency.exponentialRampToValueAtTime(180, time + 0.018);
    clickGain.gain.setValueAtTime(0.14, time);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
    click.connect(clickGain);
    clickGain.connect(out);
    click.start(time);
    click.stop(time + 0.03);
  }

  private triggerSnare(time: number, decay: number) {
    const ctx = this.ctx;
    const out = this.bus.snare;
    if (!ctx || !out || !this.noise) return;
    const dur = 0.07 + decay * 0.34;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(1400, time);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(2400, time);
    band.Q.setValueAtTime(0.65, time);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    source.connect(highpass);
    highpass.connect(band);
    band.connect(gain);
    gain.connect(out);
    source.start(time, Math.random() * 0.5);
    source.stop(time + dur + 0.02);

    const tone = ctx.createOscillator();
    const toneGain = ctx.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(198, time);
    tone.frequency.exponentialRampToValueAtTime(140, time + 0.12);
    toneGain.gain.setValueAtTime(0.32, time);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(dur, 0.18));
    tone.connect(toneGain);
    toneGain.connect(out);
    tone.start(time);
    tone.stop(time + dur + 0.02);
  }

  private triggerHat(time: number, decay: number) {
    const ctx = this.ctx;
    const out = this.bus.hat;
    if (!ctx || !out || !this.noise) return;
    const dur = 0.018 + decay * 0.15;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(7000, time);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(out);
    source.start(time, Math.random() * 0.55);
    source.stop(time + dur + 0.03);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(8600, time);
    band.Q.setValueAtTime(0.85, time);
    const metalGain = ctx.createGain();
    metalGain.gain.setValueAtTime(0.1, time);
    metalGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    band.connect(metalGain);
    metalGain.connect(out);
    for (const freq of [5210, 7480, 9800, 12400]) {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(band);
      osc.start(time);
      osc.stop(time + dur + 0.03);
    }
  }

  private triggerBass(time: number, decay: number, midi: number) {
    const ctx = this.ctx;
    const out = this.bus.bass;
    if (!ctx || !out) return;
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const dur = 0.08 + decay * 0.58;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.setValueAtTime(4.5, time);
    filter.frequency.setValueAtTime(280 + decay * 1100, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.4, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.setValueAtTime(freq, time);
    saw.frequency.exponentialRampToValueAtTime(freq * 0.985, time + dur);
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(freq / 2, time);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.65, time);
    saw.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    saw.start(time);
    sub.start(time);
    saw.stop(time + dur + 0.03);
    sub.stop(time + dur + 0.03);
  }

  private async attachRecorder() {
    this.pcm = [];
    try {
      await this.ensureWorklet();
      this.connectWorklet();
      this.recorderMode = "worklet";
    } catch {
      this.detachWorklet();
      this.startMedia();
      this.recorderMode = "media";
    }
    this.recording = true;
    this.recordStartedAt = this.ctx?.currentTime ?? 0;
  }

  private async ensureWorklet() {
    const ctx = this.ctx;
    if (!ctx) throw new Error("El audio no está listo.");
    if (this.workletReady) return;
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    try {
      await ctx.audioWorklet.addModule(url);
      this.workletReady = true;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private connectWorklet() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) throw new Error("El audio no está listo.");
    const node = new AudioWorkletNode(ctx, "volta-capture", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: "explicit",
      outputChannelCount: [1],
    });
    node.port.onmessage = (event: MessageEvent<{ done?: boolean; samples?: Float32Array }>) => {
      const samples = event.data?.samples;
      if (samples && samples.length) this.pcm.push(samples);
      if (event.data?.done && this.captureDone) {
        const resolve = this.captureDone;
        this.captureDone = null;
        resolve();
      }
    };
    const mute = ctx.createGain();
    mute.gain.value = 0;
    master.connect(node);
    node.connect(mute);
    mute.connect(ctx.destination);
    this.workletNode = node;
    this.workletMute = mute;
  }

  private detachWorklet() {
    if (this.master && this.workletNode) {
      try {
        this.master.disconnect(this.workletNode);
      } catch {
        /* already disconnected */
      }
    }
    try {
      this.workletNode?.disconnect();
    } catch {
      /* already disconnected */
    }
    try {
      this.workletMute?.disconnect();
    } catch {
      /* already disconnected */
    }
    if (this.workletNode) this.workletNode.port.onmessage = null;
    this.workletNode = null;
    this.workletMute = null;
  }

  private startMedia() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) throw new Error("El audio no está listo.");
    if (typeof MediaRecorder === "undefined") {
      throw new Error("Este navegador no puede grabar el audio.");
    }
    if (!this.streamDest) {
      this.streamDest = ctx.createMediaStreamDestination();
      master.connect(this.streamDest);
    }
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
    const mime = candidates.find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = mime
      ? new MediaRecorder(this.streamDest.stream, { mimeType: mime })
      : new MediaRecorder(this.streamDest.stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    this.mediaChunks = chunks;
    this.mediaRecorder = recorder;
    recorder.start(200);
  }

  private finishMediaRecorder() {
    const recorder = this.mediaRecorder;
    if (!recorder) return Promise.reject(new Error("No hay una grabación en curso."));
    return new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(this.mediaChunks, { type: recorder.mimeType || "audio/webm" });
        this.mediaRecorder = null;
        this.mediaChunks = [];
        if (blob.size < 64) reject(new Error("La toma está vacía. Deja sonar el patrón un momento."));
        else resolve(blob);
      };
      recorder.onerror = () => reject(new Error("Falló la grabación."));
      if (recorder.state !== "inactive") recorder.stop();
      else reject(new Error("La grabación ya estaba detenida."));
    });
  }
}
