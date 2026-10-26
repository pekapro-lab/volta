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

export type GrooveState = {
  bpm: number;
  master: number;
  presetId: string | null;
  steps: Record<ChannelId, boolean[]>;
  lanes: Record<ChannelId, Lane>;
  bass: number[];
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
  };
}

function isUnit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isBool16(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.length === STEPS && value.every((cell) => typeof cell === "boolean");
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
