import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, i as Play, n as RotateCcw, o as Minus, r as Plus, s as Download } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BOvxrusP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function clamp(value) {
	return Math.min(1, Math.max(0, value));
}
function Knob({ label, value, onChange }) {
	const drag = (0, import_react.useRef)(null);
	const angle = -135 + value * 270;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "knob-wrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "slider",
			tabIndex: 0,
			"aria-label": label,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": Math.round(value * 100),
			"aria-orientation": "vertical",
			className: "knob",
			onPointerDown: (event) => {
				event.currentTarget.focus();
				event.currentTarget.setPointerCapture(event.pointerId);
				drag.current = {
					y: event.clientY,
					v: value
				};
			},
			onPointerMove: (event) => {
				if (!drag.current) return;
				onChange(clamp(drag.current.v + (drag.current.y - event.clientY) / 110));
			},
			onPointerUp: () => {
				drag.current = null;
			},
			onPointerCancel: () => {
				drag.current = null;
			},
			onKeyDown: (event) => {
				const step = event.shiftKey ? .1 : .02;
				if (event.key === "ArrowUp" || event.key === "ArrowRight") {
					event.preventDefault();
					onChange(clamp(value + step));
				} else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
					event.preventDefault();
					onChange(clamp(value - step));
				} else if (event.key === "Home") {
					event.preventDefault();
					onChange(0);
				} else if (event.key === "End") {
					event.preventDefault();
					onChange(1);
				}
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "knob-rotor",
				style: { transform: `rotate(${angle}deg)` }
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "knob-caption",
			children: ["Decay", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums",
				children: Math.round(value * 100)
			})]
		})]
	});
}
var STORAGE_KEY = "volta-groove-v1";
var CHANNEL_IDS = [
	"kick",
	"snare",
	"hat",
	"bass"
];
var CHANNELS = [
	{
		id: "kick",
		label: "Bombo",
		hint: "bombo"
	},
	{
		id: "snare",
		label: "Caja",
		hint: "caja"
	},
	{
		id: "hat",
		label: "Plato",
		hint: "platillo"
	},
	{
		id: "bass",
		label: "Bajo",
		hint: "bajo"
	}
];
var DEFAULT_LANES = {
	kick: {
		volume: .9,
		decay: .42,
		mute: false,
		solo: false
	},
	snare: {
		volume: .74,
		decay: .4,
		mute: false,
		solo: false
	},
	hat: {
		volume: .5,
		decay: .24,
		mute: false,
		solo: false
	},
	bass: {
		volume: .8,
		decay: .52,
		mute: false,
		solo: false
	}
};
function bits(pattern) {
	return pattern.split("").map((cell) => cell === "1");
}
function row() {
	return Array.from({ length: 16 }, () => false);
}
function emptySteps() {
	return {
		kick: row(),
		snare: row(),
		hat: row(),
		bass: row()
	};
}
function cloneSteps(steps) {
	return {
		kick: steps.kick.slice(),
		snare: steps.snare.slice(),
		hat: steps.hat.slice(),
		bass: steps.bass.slice()
	};
}
var PRESETS = [
	{
		id: "casa",
		name: "Casa",
		bpm: 124,
		steps: {
			kick: bits("1000100010001000"),
			snare: bits("0000100000001000"),
			hat: bits("0010001000100011"),
			bass: bits("1001001010010010")
		},
		bass: [
			40,
			40,
			43,
			40,
			38,
			38,
			40,
			35,
			40,
			40,
			45,
			43,
			38,
			40,
			38,
			35
		]
	},
	{
		id: "break",
		name: "Break",
		bpm: 96,
		steps: {
			kick: bits("1000001000100000"),
			snare: bits("0000100100001001"),
			hat: bits("1111111110111110"),
			bass: bits("1000101000101001")
		},
		bass: [
			36,
			36,
			36,
			43,
			36,
			36,
			41,
			43,
			34,
			34,
			41,
			36,
			34,
			36,
			39,
			41
		]
	},
	{
		id: "electro",
		name: "Electro",
		bpm: 118,
		steps: {
			kick: bits("1000000100100000"),
			snare: bits("0000100000001000"),
			hat: bits("1011011010110101"),
			bass: bits("1010100101001010")
		},
		bass: [
			43,
			43,
			41,
			43,
			38,
			38,
			36,
			38,
			43,
			41,
			43,
			46,
			38,
			36,
			38,
			31
		]
	}
];
function defaultState() {
	const preset = PRESETS[0];
	return {
		bpm: preset.bpm,
		master: .82,
		presetId: preset.id,
		steps: cloneSteps(preset.steps),
		lanes: {
			kick: { ...DEFAULT_LANES.kick },
			snare: { ...DEFAULT_LANES.snare },
			hat: { ...DEFAULT_LANES.hat },
			bass: { ...DEFAULT_LANES.bass }
		},
		bass: preset.bass.slice()
	};
}
function isUnit(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
function isBool16(value) {
	return Array.isArray(value) && value.length === 16 && value.every((cell) => typeof cell === "boolean");
}
function loadGroove(raw) {
	if (!raw) return null;
	try {
		const data = JSON.parse(raw);
		if (!data.steps || !data.lanes || !Array.isArray(data.bass)) return null;
		for (const id of CHANNEL_IDS) {
			if (!isBool16(data.steps[id])) return null;
			const lane = data.lanes[id];
			if (!lane || !isUnit(lane.volume) || !isUnit(lane.decay)) return null;
			if (typeof lane.mute !== "boolean" || typeof lane.solo !== "boolean") return null;
		}
		if (data.bass.length !== 16 || data.bass.some((n) => typeof n !== "number" || n < 0 || n > 127)) return null;
		return {
			bpm: typeof data.bpm === "number" && Number.isFinite(data.bpm) ? Math.round(Math.min(180, Math.max(60, data.bpm))) : PRESETS[0].bpm,
			master: isUnit(data.master) ? data.master : .82,
			presetId: typeof data.presetId === "string" ? data.presetId : null,
			steps: cloneSteps(data.steps),
			lanes: {
				kick: { ...data.lanes.kick },
				snare: { ...data.lanes.snare },
				hat: { ...data.lanes.hat },
				bass: { ...data.lanes.bass }
			},
			bass: data.bass.slice()
		};
	} catch {
		return null;
	}
}
function formatClock(seconds) {
	const whole = Math.max(0, Math.floor(seconds));
	const minutes = Math.floor(whole / 60);
	const remain = whole % 60;
	return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}
function writeString(view, offset, text) {
	for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}
function concatFloats(chunks) {
	let length = 0;
	for (const chunk of chunks) length += chunk.length;
	const out = new Float32Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.length;
	}
	return out;
}
function encodeWav(samples, sampleRate) {
	const dataSize = samples.length * 2;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	writeString(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeString(view, 8, "WAVE");
	writeString(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeString(view, 36, "data");
	view.setUint32(40, dataSize, true);
	let offset = 44;
	for (let i = 0; i < samples.length; i++) {
		const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
		view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
		offset += 2;
	}
	return new Blob([buffer], { type: "audio/wav" });
}
async function decodeToWav(ctx, blob) {
	const copy = (await blob.arrayBuffer()).slice(0);
	const audio = await ctx.decodeAudioData(copy);
	const left = audio.getChannelData(0);
	const right = audio.numberOfChannels > 1 ? audio.getChannelData(1) : left;
	const mono = new Float32Array(audio.length);
	for (let i = 0; i < audio.length; i++) mono[i] = ((left[i] ?? 0) + (right[i] ?? 0)) * .5;
	return encodeWav(mono, audio.sampleRate);
}
var WORKLET = `
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
var GrooveEngine = class {
	ctx = null;
	master = null;
	compressor = null;
	analyser = null;
	noise = null;
	bus = {};
	spectrum = /* @__PURE__ */ new Uint8Array(64);
	state = null;
	playing = false;
	heldStep = 0;
	scheduleIndex = 0;
	nextNoteTime = 0;
	timer = null;
	events = [];
	recording = false;
	recordStartedAt = 0;
	recorderMode = null;
	workletReady = false;
	workletNode = null;
	workletMute = null;
	pcm = [];
	captureDone = null;
	streamDest = null;
	mediaRecorder = null;
	mediaChunks = [];
	sync(state) {
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
		for (const event of this.events) if (event.time <= now) step = event.step;
		return step;
	}
	readSpectrum() {
		if (!this.analyser) return null;
		if (this.spectrum.length !== this.analyser.frequencyBinCount) this.spectrum = new Uint8Array(this.analyser.frequencyBinCount);
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
	async stopRecording() {
		if (!this.recording || !this.ctx) throw new Error("No hay una grabación en curso.");
		this.recording = false;
		try {
			if (this.recorderMode === "worklet") {
				const done = new Promise((resolve) => {
					this.captureDone = resolve;
				});
				this.workletNode?.port.postMessage("stop");
				await Promise.race([done, new Promise((resolve) => window.setTimeout(resolve, 1200))]);
				this.captureDone = null;
				this.detachWorklet();
				const pcm = concatFloats(this.pcm);
				this.pcm = [];
				if (pcm.length < 32) throw new Error("La toma está vacía. Deja sonar el patrón un momento.");
				return {
					blob: encodeWav(pcm, this.ctx.sampleRate),
					extension: "wav"
				};
			}
			const blob = await this.finishMediaRecorder();
			try {
				return {
					blob: await decodeToWav(this.ctx, blob),
					extension: "wav"
				};
			} catch {
				return {
					blob,
					extension: blob.type.includes("ogg") ? "ogg" : "webm"
				};
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
		this.ctx?.close();
		this.ctx = null;
	}
	ensureContext() {
		if (this.ctx) return this.ctx;
		const ctx = new AudioContext();
		const compressor = ctx.createDynamicsCompressor();
		compressor.threshold.value = -16;
		compressor.knee.value = 12;
		compressor.ratio.value = 3.5;
		compressor.attack.value = .004;
		compressor.release.value = .18;
		const master = ctx.createGain();
		master.gain.value = this.state?.master ?? .82;
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 128;
		analyser.smoothingTimeConstant = .72;
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
		this.applyMix();
		return ctx;
	}
	makeNoise(ctx) {
		const length = ctx.sampleRate;
		const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
		return buffer;
	}
	applyMix() {
		if (!this.ctx || !this.master || !this.state) return;
		const anySolo = CHANNEL_IDS.some((id) => this.state?.lanes[id].solo);
		const now = this.ctx.currentTime;
		for (const id of CHANNEL_IDS) {
			const lane = this.state.lanes[id];
			const audible = !lane.mute && (!anySolo || lane.solo);
			this.bus[id]?.gain.setTargetAtTime(audible ? lane.volume : 0, now, .012);
		}
		this.master.gain.setTargetAtTime(this.state.master, now, .012);
	}
	stepDuration() {
		return 60 / Math.min(180, Math.max(60, this.state?.bpm ?? 120)) / 4;
	}
	armScheduler() {
		if (!this.ctx || this.playing) return;
		this.events = [];
		this.scheduleIndex = this.heldStep;
		this.nextNoteTime = this.ctx.currentTime + .05;
		this.playing = true;
		this.tick();
	}
	tick = () => {
		if (!this.playing || !this.ctx) return;
		const horizon = this.ctx.currentTime + .12;
		while (this.nextNoteTime < horizon) {
			this.fire(this.scheduleIndex, this.nextNoteTime);
			this.events.push({
				step: this.scheduleIndex,
				time: this.nextNoteTime
			});
			this.nextNoteTime += this.stepDuration();
			this.scheduleIndex = (this.scheduleIndex + 1) % 16;
		}
		const now = this.ctx.currentTime;
		if (this.events.length > 24) this.events = this.events.filter((event) => event.time > now - .4);
		this.timer = window.setTimeout(this.tick, 25);
	};
	fire(step, time) {
		const state = this.state;
		if (!state) return;
		if (state.steps.kick[step]) this.triggerKick(time, state.lanes.kick.decay);
		if (state.steps.snare[step]) this.triggerSnare(time, state.lanes.snare.decay);
		if (state.steps.hat[step]) this.triggerHat(time, state.lanes.hat.decay);
		if (state.steps.bass[step]) this.triggerBass(time, state.lanes.bass.decay, state.bass[step] ?? 40);
	}
	triggerKick(time, decay) {
		const ctx = this.ctx;
		const out = this.bus.kick;
		if (!ctx || !out) return;
		const dur = .1 + decay * .48;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(168, time);
		osc.frequency.exponentialRampToValueAtTime(54, time + .055);
		osc.frequency.exponentialRampToValueAtTime(42, time + dur);
		gain.gain.setValueAtTime(1e-4, time);
		gain.gain.exponentialRampToValueAtTime(.9, time + .004);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + dur);
		osc.connect(gain);
		gain.connect(out);
		osc.start(time);
		osc.stop(time + dur + .02);
		const click = ctx.createOscillator();
		const clickGain = ctx.createGain();
		click.type = "square";
		click.frequency.setValueAtTime(920, time);
		click.frequency.exponentialRampToValueAtTime(180, time + .018);
		clickGain.gain.setValueAtTime(.14, time);
		clickGain.gain.exponentialRampToValueAtTime(1e-4, time + .02);
		click.connect(clickGain);
		clickGain.connect(out);
		click.start(time);
		click.stop(time + .03);
	}
	triggerSnare(time, decay) {
		const ctx = this.ctx;
		const out = this.bus.snare;
		if (!ctx || !out || !this.noise) return;
		const dur = .07 + decay * .34;
		const source = ctx.createBufferSource();
		source.buffer = this.noise;
		const highpass = ctx.createBiquadFilter();
		highpass.type = "highpass";
		highpass.frequency.setValueAtTime(1400, time);
		const band = ctx.createBiquadFilter();
		band.type = "bandpass";
		band.frequency.setValueAtTime(2400, time);
		band.Q.setValueAtTime(.65, time);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(.5, time);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + dur);
		source.connect(highpass);
		highpass.connect(band);
		band.connect(gain);
		gain.connect(out);
		source.start(time, Math.random() * .5);
		source.stop(time + dur + .02);
		const tone = ctx.createOscillator();
		const toneGain = ctx.createGain();
		tone.type = "triangle";
		tone.frequency.setValueAtTime(198, time);
		tone.frequency.exponentialRampToValueAtTime(140, time + .12);
		toneGain.gain.setValueAtTime(.32, time);
		toneGain.gain.exponentialRampToValueAtTime(1e-4, time + Math.min(dur, .18));
		tone.connect(toneGain);
		toneGain.connect(out);
		tone.start(time);
		tone.stop(time + dur + .02);
	}
	triggerHat(time, decay) {
		const ctx = this.ctx;
		const out = this.bus.hat;
		if (!ctx || !out || !this.noise) return;
		const dur = .018 + decay * .15;
		const highpass = ctx.createBiquadFilter();
		highpass.type = "highpass";
		highpass.frequency.setValueAtTime(7e3, time);
		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(.3, time);
		noiseGain.gain.exponentialRampToValueAtTime(1e-4, time + dur);
		const source = ctx.createBufferSource();
		source.buffer = this.noise;
		source.connect(highpass);
		highpass.connect(noiseGain);
		noiseGain.connect(out);
		source.start(time, Math.random() * .55);
		source.stop(time + dur + .03);
		const band = ctx.createBiquadFilter();
		band.type = "bandpass";
		band.frequency.setValueAtTime(8600, time);
		band.Q.setValueAtTime(.85, time);
		const metalGain = ctx.createGain();
		metalGain.gain.setValueAtTime(.1, time);
		metalGain.gain.exponentialRampToValueAtTime(1e-4, time + dur);
		band.connect(metalGain);
		metalGain.connect(out);
		for (const freq of [
			5210,
			7480,
			9800,
			12400
		]) {
			const osc = ctx.createOscillator();
			osc.type = "square";
			osc.frequency.setValueAtTime(freq, time);
			osc.connect(band);
			osc.start(time);
			osc.stop(time + dur + .03);
		}
	}
	triggerBass(time, decay, midi) {
		const ctx = this.ctx;
		const out = this.bus.bass;
		if (!ctx || !out) return;
		const freq = 440 * 2 ** ((midi - 69) / 12);
		const dur = .08 + decay * .58;
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.Q.setValueAtTime(4.5, time);
		filter.frequency.setValueAtTime(280 + decay * 1100, time);
		filter.frequency.exponentialRampToValueAtTime(160, time + dur);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(1e-4, time);
		gain.gain.exponentialRampToValueAtTime(.4, time + .012);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + dur);
		const saw = ctx.createOscillator();
		saw.type = "sawtooth";
		saw.frequency.setValueAtTime(freq, time);
		saw.frequency.exponentialRampToValueAtTime(freq * .985, time + dur);
		const sub = ctx.createOscillator();
		sub.type = "sine";
		sub.frequency.setValueAtTime(freq / 2, time);
		const subGain = ctx.createGain();
		subGain.gain.setValueAtTime(.65, time);
		saw.connect(filter);
		sub.connect(subGain);
		subGain.connect(filter);
		filter.connect(gain);
		gain.connect(out);
		saw.start(time);
		sub.start(time);
		saw.stop(time + dur + .03);
		sub.stop(time + dur + .03);
	}
	async attachRecorder() {
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
	async ensureWorklet() {
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
	connectWorklet() {
		const ctx = this.ctx;
		const master = this.master;
		if (!ctx || !master) throw new Error("El audio no está listo.");
		const node = new AudioWorkletNode(ctx, "volta-capture", {
			numberOfInputs: 1,
			numberOfOutputs: 1,
			channelCount: 1,
			channelCountMode: "explicit",
			outputChannelCount: [1]
		});
		node.port.onmessage = (event) => {
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
	detachWorklet() {
		if (this.master && this.workletNode) try {
			this.master.disconnect(this.workletNode);
		} catch {}
		try {
			this.workletNode?.disconnect();
		} catch {}
		try {
			this.workletMute?.disconnect();
		} catch {}
		if (this.workletNode) this.workletNode.port.onmessage = null;
		this.workletNode = null;
		this.workletMute = null;
	}
	startMedia() {
		const ctx = this.ctx;
		const master = this.master;
		if (!ctx || !master) throw new Error("El audio no está listo.");
		if (typeof MediaRecorder === "undefined") throw new Error("Este navegador no puede grabar el audio.");
		if (!this.streamDest) {
			this.streamDest = ctx.createMediaStreamDestination();
			master.connect(this.streamDest);
		}
		const mime = [
			"audio/webm;codecs=opus",
			"audio/webm",
			"audio/ogg;codecs=opus",
			"audio/ogg"
		].find((type) => MediaRecorder.isTypeSupported(type));
		const recorder = mime ? new MediaRecorder(this.streamDest.stream, { mimeType: mime }) : new MediaRecorder(this.streamDest.stream);
		const chunks = [];
		recorder.ondataavailable = (event) => {
			if (event.data.size) chunks.push(event.data);
		};
		this.mediaChunks = chunks;
		this.mediaRecorder = recorder;
		recorder.start(200);
	}
	finishMediaRecorder() {
		const recorder = this.mediaRecorder;
		if (!recorder) return Promise.reject(/* @__PURE__ */ new Error("No hay una grabación en curso."));
		return new Promise((resolve, reject) => {
			recorder.onstop = () => {
				const blob = new Blob(this.mediaChunks, { type: recorder.mimeType || "audio/webm" });
				this.mediaRecorder = null;
				this.mediaChunks = [];
				if (blob.size < 64) reject(/* @__PURE__ */ new Error("La toma está vacía. Deja sonar el patrón un momento."));
				else resolve(blob);
			};
			recorder.onerror = () => reject(/* @__PURE__ */ new Error("Falló la grabación."));
			if (recorder.state !== "inactive") recorder.stop();
			else reject(/* @__PURE__ */ new Error("La grabación ya estaba detenida."));
		});
	}
};
var METER_BARS = 36;
function paintMeter(meter, data) {
	const bars = meter.children;
	for (let i = 0; i < bars.length; i++) {
		const bar = bars[i];
		if (!(bar instanceof HTMLElement)) continue;
		let amount = .08;
		if (data && data.length) {
			const index = Math.min(data.length - 1, Math.floor(i / bars.length * data.length * .72));
			amount = Math.max(.08, (data[index] ?? 0) / 255);
		}
		bar.style.transform = `scaleY(${amount})`;
		bar.style.opacity = data ? String(.35 + amount * .65) : "0.28";
	}
}
function Groovebox() {
	const [state, setState] = (0, import_react.useState)(() => defaultState());
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [recording, setRecording] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [playhead, setPlayhead] = (0, import_react.useState)(0);
	const [recSec, setRecSec] = (0, import_react.useState)(0);
	const [error, setError] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	const [file, setFile] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const stateRef = (0, import_react.useRef)(state);
	stateRef.current = state;
	const engineRef = (0, import_react.useRef)(null);
	const meterRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const busy = (0, import_react.useRef)(false);
	const playingRef = (0, import_react.useRef)(false);
	const recordRef = (0, import_react.useRef)(() => {});
	(0, import_react.useEffect)(() => {
		const saved = loadGroove(localStorage.getItem(STORAGE_KEY));
		if (saved) setState(saved);
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}, [state, ready]);
	(0, import_react.useEffect)(() => {
		const engine = new GrooveEngine();
		engineRef.current = engine;
		engine.sync(stateRef.current);
		return () => {
			engine.dispose();
			engineRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		engineRef.current?.sync(state);
	}, [state]);
	(0, import_react.useEffect)(() => {
		let frame = 0;
		let lastStep = -1;
		const loop = () => {
			const engine = engineRef.current;
			const meter = meterRef.current;
			if (engine) {
				const step = engine.getPlayhead();
				if (step !== lastStep) {
					lastStep = step;
					setPlayhead(step);
				}
				const seconds = Math.floor(engine.recordingElapsed());
				setRecSec((current) => current === seconds ? current : seconds);
				if (meter) paintMeter(meter, engine.isPlaying() || engine.isRecording() ? engine.readSpectrum() : null);
				if (engine.isRecording() && engine.recordingElapsed() >= 180 && !busy.current) recordRef.current();
			}
			frame = window.requestAnimationFrame(loop);
		};
		frame = window.requestAnimationFrame(loop);
		return () => window.cancelAnimationFrame(frame);
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			if (fileRef.current) URL.revokeObjectURL(fileRef.current.url);
		};
	}, []);
	function patchLane(id, patch) {
		setState((current) => ({
			...current,
			lanes: {
				...current.lanes,
				[id]: {
					...current.lanes[id],
					...patch
				}
			}
		}));
	}
	function toggleStep(id, index) {
		setState((current) => {
			const row = current.steps[id].slice();
			row[index] = !row[index];
			return {
				...current,
				presetId: null,
				steps: {
					...current.steps,
					[id]: row
				}
			};
		});
	}
	function applyPreset(preset) {
		setState((current) => ({
			...current,
			presetId: preset.id,
			bpm: preset.bpm,
			bass: preset.bass.slice(),
			steps: {
				kick: preset.steps.kick.slice(),
				snare: preset.steps.snare.slice(),
				hat: preset.steps.hat.slice(),
				bass: preset.steps.bass.slice()
			}
		}));
	}
	function clearGrid() {
		const blank = emptySteps();
		setState((current) => ({
			...current,
			presetId: null,
			steps: blank
		}));
	}
	async function onPlay() {
		const engine = engineRef.current;
		if (!engine) return;
		setError(null);
		try {
			engine.sync(stateRef.current);
			await engine.play();
			setPlaying(true);
			playingRef.current = true;
		} catch {
			setError("El audio no se pudo iniciar. Vuelve a pulsar Play.");
		}
	}
	function onPause() {
		engineRef.current?.pause();
		setPlaying(false);
		playingRef.current = false;
		setPlayhead(engineRef.current?.getPlayhead() ?? 0);
	}
	async function onRecord() {
		const engine = engineRef.current;
		if (!engine || busy.current) return;
		if (engine.isRecording()) {
			busy.current = true;
			setPhase("encoding");
			try {
				const result = await engine.stopRecording();
				const name = `volta-${stateRef.current.bpm}bpm.${result.extension}`;
				if (fileRef.current) URL.revokeObjectURL(fileRef.current.url);
				const url = URL.createObjectURL(result.blob);
				const next = {
					url,
					name
				};
				fileRef.current = next;
				setFile(next);
				const link = document.createElement("a");
				link.href = url;
				link.download = name;
				document.body.appendChild(link);
				link.click();
				link.remove();
				setNote(result.extension === "wav" ? "Bucle listo. Si la descarga no empezó sola, usa el enlace." : `No se pudo empaquetar WAV. El audio está en ${result.extension}.`);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : "No se pudo exportar el audio.");
			} finally {
				busy.current = false;
				setPhase("idle");
				setRecording(false);
				setRecSec(0);
			}
			return;
		}
		setError(null);
		setNote(null);
		try {
			engine.sync(stateRef.current);
			await engine.startRecording();
			setRecording(true);
			setPlaying(true);
			playingRef.current = true;
		} catch (err) {
			setRecording(false);
			setPlaying(engine.isPlaying());
			playingRef.current = engine.isPlaying();
			setError(err instanceof Error ? err.message : "No se pudo grabar.");
		}
	}
	recordRef.current = () => {
		onRecord();
	};
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.code !== "Space" || event.repeat) return;
			if (event.target?.closest("button, a, input, textarea, select, [role='slider']")) return;
			event.preventDefault();
			if (playingRef.current) onPause();
			else onPlay();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const allOff = CHANNEL_IDS.every((id) => state.steps[id].every((cell) => !cell));
	const recordLabel = phase === "encoding" ? "Codificando…" : recording ? "Detener y descargar" : "Grabar y exportar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "shell grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex flex-wrap items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mark",
								"aria-hidden": true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-4xl leading-none font-extrabold tracking-wide",
								children: "VOLTA"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Máquina de groove · 16 pasos"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-muted",
								children: "PASO"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-4xl leading-none font-extrabold tabular-nums",
								children: String(playhead + 1).padStart(2, "0")
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "deck-grid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "transport-buttons flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn btn-primary",
										"data-active": playing ? "true" : "false",
										onClick: () => void onPlay(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
											className: "size-4",
											"aria-hidden": true
										}), "Reproducir"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn",
										onClick: onPause,
										disabled: !playing,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
											className: "size-4",
											"aria-hidden": true
										}), "Pausa"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn",
										onClick: clearGrid,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
											className: "size-4",
											"aria-hidden": true
										}), "Limpiar"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rec-deck",
								"data-live": recording ? "true" : "false",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-xs tracking-widest text-muted uppercase",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "led",
												"data-on": recording ? "true" : "false",
												"aria-hidden": true
											}), recording ? "Grabando" : "Grabación"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-display text-lg tabular-nums",
											children: recording || phase === "encoding" ? formatClock(recSec) : "00:00"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn btn-rec",
										onClick: () => void onRecord(),
										disabled: phase === "encoding",
										children: recordLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: "Captura lo que suena y descarga un WAV."
									}),
									file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										className: "btn",
										href: file.url,
										download: file.name,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
											className: "size-4",
											"aria-hidden": true
										}), file.name]
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "transport-sliders grid content-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center justify-between gap-3 text-xs tracking-widest text-muted uppercase",
										children: ["Tempo", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-display text-base tracking-normal text-fg tabular-nums",
											children: [state.bpm, " BPM"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "mix",
												"aria-label": "Bajar tempo",
												onClick: () => setState((current) => ({
													...current,
													bpm: Math.max(60, current.bpm - 1)
												})),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
													className: "size-4",
													"aria-hidden": true
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: "fader",
												type: "range",
												min: 60,
												max: 180,
												value: state.bpm,
												"aria-label": "Tempo en BPM",
												suppressHydrationWarning: true,
												onChange: (event) => setState((current) => ({
													...current,
													bpm: Number(event.target.value)
												}))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "mix",
												"aria-label": "Subir tempo",
												onClick: () => setState((current) => ({
													...current,
													bpm: Math.min(180, current.bpm + 1)
												})),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
													className: "size-4",
													"aria-hidden": true
												})
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center justify-between text-xs tracking-widest text-muted uppercase",
										children: ["Salida", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums text-fg",
											children: Math.round(state.master * 100)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "fader",
										type: "range",
										min: 0,
										max: 100,
										value: Math.round(state.master * 100),
										"aria-label": "Volumen de salida",
										suppressHydrationWarning: true,
										onChange: (event) => setState((current) => ({
											...current,
											master: Number(event.target.value) / 100
										}))
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: meterRef,
						className: "meter",
						"aria-hidden": true,
						children: Array.from({ length: METER_BARS }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}, index))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "sr-only",
						"aria-live": "polite",
						children: recording ? "Grabando audio" : phase === "encoding" ? "Codificando el bucle" : playing ? "Reproduciendo" : "En pausa"
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm text-rec",
				children: error
			}) : null,
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: note
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3",
				"aria-label": "Patrones",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mr-1 text-xs tracking-widest text-muted uppercase",
							children: "Patrones"
						}), PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "preset",
							"aria-pressed": state.presetId === preset.id,
							onClick: () => applyPreset(preset),
							children: preset.name
						}, preset.id))]
					}),
					allOff ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "La rejilla está vacía. Activa pasos o carga un patrón."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "M silencia el canal. S lo aísla. La caída controla la duración de cada golpe."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-3",
				"aria-label": "Secuenciador",
				children: CHANNELS.map((channel) => {
					const lane = state.lanes[channel.id];
					const hit = playing && state.steps[channel.id][playhead];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "lane",
						"data-channel": channel.id,
						"data-hit": hit ? "true" : "false",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid min-w-0 flex-1 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "pip",
											"aria-hidden": true
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "lane-name text-sm",
											children: channel.label
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "mix",
											"aria-pressed": lane.mute,
											"aria-label": `Silenciar ${channel.hint}`,
											onClick: () => patchLane(channel.id, { mute: !lane.mute }),
											children: "M"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "mix",
											"aria-pressed": lane.solo,
											"aria-label": `Solo ${channel.hint}`,
											onClick: () => patchLane(channel.id, { solo: !lane.solo }),
											children: "S"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "grid gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex justify-between text-xs tracking-widest text-muted uppercase",
											children: ["Volumen", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "tabular-nums",
												children: Math.round(lane.volume * 100)
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "fader",
											type: "range",
											min: 0,
											max: 100,
											value: Math.round(lane.volume * 100),
											"aria-label": `Volumen de ${channel.hint}`,
											suppressHydrationWarning: true,
											onChange: (event) => patchLane(channel.id, { volume: Number(event.target.value) / 100 })
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: `Decay de ${channel.hint}`,
								value: lane.decay,
								onChange: (decay) => patchLane(channel.id, { decay })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "step-strip",
							role: "group",
							"aria-label": `Pasos de ${channel.hint}`,
							children: [
								0,
								1,
								2,
								3
							].map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "step-group",
								children: [
									0,
									1,
									2,
									3
								].map((offset) => {
									const index = group * 4 + offset;
									const on = state.steps[channel.id][index];
									const now = playhead === index;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "step",
										"data-on": on ? "true" : "false",
										"data-now": now ? "true" : "false",
										"aria-pressed": on,
										"aria-label": `${channel.label}, paso ${index + 1}${now ? ", actual" : ""}`,
										onClick: () => toggleStep(channel.id, index),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "step-num",
											children: index + 1
										})
									}, index);
								})
							}, group))
						})]
					}, channel.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pb-2 text-center text-xs text-muted",
				children: "Síntesis en el navegador · cuatro canales · exportación WAV"
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Groovebox, {});
}
//#endregion
export { Home as component };
