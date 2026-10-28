export const STEPS = 16;
export const STORAGE_KEY = "volta-groove-v1";

export const CHANNEL_IDS = ["kick", "snare", "hat", "bass"] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];

export type Lane = {
  volume: number;
  decay: number;
  mute: boolean;
  solo: boolean;
};

export const SAMPLE_BANKS = [
  { id: "drums", label: "Batería" },
  { id: "perc", label: "Percusión" },
  { id: "bass", label: "Bajos" },
  { id: "synth", label: "Synth" },
  { id: "fx", label: "FX" },
  { id: "vox", label: "Voces" },
] as const;
export type BankId = (typeof SAMPLE_BANKS)[number]["id"];
export const BANK_IDS = SAMPLE_BANKS.map((bank) => bank.id) as BankId[];

export const SAMPLES = [
  { id: "kick808", label: "Bombo 808", bank: "drums", key: "1" },
  { id: "kickpunch", label: "Bombo seco", bank: "drums", key: "2" },
  { id: "snare2", label: "Caja", bank: "drums", key: "3" },
  { id: "clap", label: "Clap", bank: "drums", key: "4" },
  { id: "rim", label: "Aro", bank: "drums", key: "5" },
  { id: "tom", label: "Tom", bank: "drums", key: "6" },
  { id: "openhat", label: "Hat abierto", bank: "drums", key: "7" },
  { id: "crash", label: "Crash", bank: "drums", key: "8" },
  { id: "cowbell", label: "Cencerro", bank: "perc", key: "q" },
  { id: "shaker", label: "Shaker", bank: "perc", key: "w" },
  { id: "conga", label: "Conga", bank: "perc", key: "e" },
  { id: "bongo", label: "Bongo", bank: "perc", key: "r" },
  { id: "clave", label: "Clave", bank: "perc", key: "t" },
  { id: "tambo", label: "Pandereta", bank: "perc", key: "y" },
  { id: "wood", label: "Bloque", bank: "perc", key: "u" },
  { id: "triangle", label: "Triángulo", bank: "perc", key: "i" },
  { id: "sub", label: "Sub", bank: "bass", key: "a" },
  { id: "acid", label: "Acid", bank: "bass", key: "s" },
  { id: "reese", label: "Reese", bank: "bass", key: "d" },
  { id: "pluckbass", label: "Bajo pluck", bank: "bass", key: "f" },
  { id: "wobble", label: "Wobble", bank: "bass", key: "g" },
  { id: "octbass", label: "Octava", bank: "bass", key: "h" },
  { id: "slide", label: "Slide", bank: "bass", key: "j" },
  { id: "fmbass", label: "FM", bank: "bass", key: "k" },
  { id: "stab", label: "Stab", bank: "synth", key: "z" },
  { id: "minor", label: "Acorde m", bank: "synth", key: "x" },
  { id: "major", label: "Acorde M", bank: "synth", key: "c" },
  { id: "pluck", label: "Pluck", bank: "synth", key: "v" },
  { id: "lead", label: "Lead", bank: "synth", key: "b" },
  { id: "pad", label: "Pad", bank: "synth", key: "n" },
  { id: "arp", label: "Arpegio", bank: "synth", key: "m" },
  { id: "bell", label: "Campana", bank: "synth", key: "," },
  { id: "laser", label: "Láser", bank: "fx" },
  { id: "zap", label: "Zap", bank: "fx" },
  { id: "siren", label: "Sirena", bank: "fx" },
  { id: "fall", label: "Caída", bank: "fx" },
  { id: "riser", label: "Subida", bank: "fx" },
  { id: "sweep", label: "Barrido", bank: "fx" },
  { id: "blip", label: "Blip", bank: "fx" },
  { id: "glitch", label: "Glitch", bank: "fx" },
  { id: "voice", label: "Voz A", bank: "vox" },
  { id: "voxe", label: "Voz E", bank: "vox" },
  { id: "voxo", label: "Voz O", bank: "vox" },
  { id: "voxi", label: "Voz I", bank: "vox" },
  { id: "hey", label: "¡Hey!", bank: "vox" },
  { id: "choir", label: "Coro", bank: "vox" },
  { id: "uh", label: "Uh", bank: "vox" },
  { id: "beatbox", label: "Beatbox", bank: "vox" },
] as const satisfies readonly { id: string; label: string; bank: BankId; key?: string }[];

export type SampleId = (typeof SAMPLES)[number]["id"];
export const SAMPLE_IDS = SAMPLES.map((sample) => sample.id) as SampleId[];

export type GrooveState = {
  bpm: number;
  master: number;
  presetId: string | null;
  steps: Record<ChannelId, boolean[]>;
  lanes: Record<ChannelId, Lane>;
  bass: number[];
  samples: Record<SampleId, boolean[]>;
  bankVol: Record<BankId, number>;
  sampleVol: number;
};

export type Preset = {
  id: string;
  name: string;
  bpm: number;
  steps: Record<ChannelId, boolean[]>;
  bass: number[];
};

export const CHANNELS: { id: ChannelId; label: string; hint: string }[] = [
  { id: "kick", label: "Bombo", hint: "bombo" },
  { id: "snare", label: "Caja", hint: "caja" },
  { id: "hat", label: "Plato", hint: "platillo" },
  { id: "bass", label: "Bajo", hint: "bajo" },
];

const DEFAULT_LANES: Record<ChannelId, Lane> = {
  kick: { volume: 0.9, decay: 0.42, mute: false, solo: false },
  snare: { volume: 0.74, decay: 0.4, mute: false, solo: false },
  hat: { volume: 0.5, decay: 0.24, mute: false, solo: false },
  bass: { volume: 0.8, decay: 0.52, mute: false, solo: false },
};

function bits(pattern: string): boolean[] {
  return pattern.split("").map((cell) => cell === "1");
}

function row(): boolean[] {
  return Array.from({ length: STEPS }, () => false);
}

export function emptySteps(): Record<ChannelId, boolean[]> {
  return { kick: row(), snare: row(), hat: row(), bass: row() };
}

export function emptySamples(): Record<SampleId, boolean[]> {
  return Object.fromEntries(SAMPLE_IDS.map((id) => [id, row()])) as Record<SampleId, boolean[]>;
}

export function defaultBankVol(): Record<BankId, number> {
  return Object.fromEntries(BANK_IDS.map((id) => [id, 0.8])) as Record<BankId, number>;
}

function readBankVol(value: unknown): Record<BankId, number> {
  const vol = defaultBankVol();
  if (!value || typeof value !== "object") return vol;
  const data = value as Partial<Record<BankId, unknown>>;
  for (const id of BANK_IDS) {
    const v = data[id];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1) vol[id] = v;
  }
  return vol;
}

function cloneSteps(steps: Record<ChannelId, boolean[]>): Record<ChannelId, boolean[]> {
  return {
    kick: steps.kick.slice(),
    snare: steps.snare.slice(),
    hat: steps.hat.slice(),
    bass: steps.bass.slice(),
  };
}

export const PRESETS: Preset[] = [
  {
    id: "casa",
    name: "Casa",
    bpm: 124,
    steps: {
      kick: bits("1000100010001000"),
      snare: bits("0000100000001000"),
      hat: bits("0010001000100011"),
      bass: bits("1001001010010010"),
    },
    bass: [40, 40, 43, 40, 38, 38, 40, 35, 40, 40, 45, 43, 38, 40, 38, 35],
  },
  {
    id: "break",
    name: "Break",
    bpm: 96,
    steps: {
      kick: bits("1000001000100000"),
      snare: bits("0000100100001001"),
      hat: bits("1111111110111110"),
      bass: bits("1000101000101001"),
    },
    bass: [36, 36, 36, 43, 36, 36, 41, 43, 34, 34, 41, 36, 34, 36, 39, 41],
  },
  {
    id: "electro",
    name: "Electro",
    bpm: 118,
    steps: {
      kick: bits("1000000100100000"),
      snare: bits("0000100000001000"),
      hat: bits("1011011010110101"),
      bass: bits("1010100101001010"),
    },
    bass: [43, 43, 41, 43, 38, 38, 36, 38, 43, 41, 43, 46, 38, 36, 38, 31],
  },
];

export function defaultState(): GrooveState {
  const preset = PRESETS[0];
  return {
    bpm: preset.bpm,
    master: 0.82,
    presetId: preset.id,
    steps: cloneSteps(preset.steps),
    lanes: {
      kick: { ...DEFAULT_LANES.kick },
      snare: { ...DEFAULT_LANES.snare },
      hat: { ...DEFAULT_LANES.hat },
      bass: { ...DEFAULT_LANES.bass },
    },
    bass: preset.bass.slice(),
    samples: emptySamples(),
    bankVol: defaultBankVol(),
    sampleVol: 0.9,
  };
}

function isUnit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isBool16(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.length === STEPS && value.every((cell) => typeof cell === "boolean");
}

function readSamples(value: unknown): Record<SampleId, boolean[]> {
  const samples = emptySamples();
  if (!value || typeof value !== "object") return samples;
  const data = value as Partial<Record<SampleId, unknown>>;
  for (const id of SAMPLE_IDS) {
    if (isBool16(data[id])) samples[id] = data[id].slice();
  }
  return samples;
}

export function loadGroove(raw: string | null): GrooveState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<GrooveState>;
    if (!data.steps || !data.lanes || !Array.isArray(data.bass)) return null;
    for (const id of CHANNEL_IDS) {
      if (!isBool16(data.steps[id])) return null;
      const lane = data.lanes[id];
      if (!lane || !isUnit(lane.volume) || !isUnit(lane.decay)) return null;
      if (typeof lane.mute !== "boolean" || typeof lane.solo !== "boolean") return null;
    }
    if (data.bass.length !== STEPS || data.bass.some((n) => typeof n !== "number" || n < 0 || n > 127)) {
      return null;
    }
    const bpm =
      typeof data.bpm === "number" && Number.isFinite(data.bpm)
        ? Math.round(Math.min(180, Math.max(60, data.bpm)))
        : PRESETS[0].bpm;
    return {
      bpm,
      master: isUnit(data.master) ? data.master : 0.82,
      presetId: typeof data.presetId === "string" ? data.presetId : null,
      steps: cloneSteps(data.steps as Record<ChannelId, boolean[]>),
      lanes: {
        kick: { ...data.lanes.kick },
        snare: { ...data.lanes.snare },
        hat: { ...data.lanes.hat },
        bass: { ...data.lanes.bass },
      },
      bass: data.bass.slice(),
      samples: readSamples(data.samples),
      bankVol: readBankVol(data.bankVol),
      sampleVol: isUnit(data.sampleVol) ? data.sampleVol : 0.9,
    };
  } catch {
    return null;
  }
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const remain = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}
