import { useEffect, useRef, useState } from "react";
import { Download, Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { Knob } from "@/components/knob";
import { GrooveEngine } from "@/lib/audio/engine";
import {
  CHANNELS,
  CHANNEL_IDS,
  PRESETS,
  SAMPLES,
  STORAGE_KEY,
  defaultState,
  emptySamples,
  emptySteps,
  formatClock,
  loadGroove,
  type ChannelId,
  type GrooveState,
  type Lane,
  type Preset,
  type SampleId,
} from "@/lib/groove/pattern";

type ExportFile = { url: string; name: string };

const METER_BARS = 36;
const PAD_TONE = ["kick", "snare", "hat", "bass"] as const;

type Screen = "groove" | "samples";

function paintMeter(meter: HTMLElement, data: Uint8Array | null) {
  const bars = meter.children;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (!(bar instanceof HTMLElement)) continue;
    let amount = 0.08;
    if (data && data.length) {
      const index = Math.min(data.length - 1, Math.floor((i / bars.length) * data.length * 0.72));
      amount = Math.max(0.08, (data[index] ?? 0) / 255);
    }
    bar.style.transform = `scaleY(${amount})`;
    bar.style.opacity = data ? String(0.35 + amount * 0.65) : "0.28";
  }
}

export function Groovebox() {
  const [state, setState] = useState<GrooveState>(() => defaultState());
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [phase, setPhase] = useState<"idle" | "encoding">("idle");
  const [playhead, setPlayhead] = useState(0);
  const [recSec, setRecSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [file, setFile] = useState<ExportFile | null>(null);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("groove");
  const [selected, setSelected] = useState<SampleId | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const engineRef = useRef<GrooveEngine | null>(null);
  const meterRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<ExportFile | null>(null);
  const busy = useRef(false);
  const playingRef = useRef(false);
  const recordRef = useRef<() => void>(() => {});

  useEffect(() => {
    const saved = loadGroove(localStorage.getItem(STORAGE_KEY));
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    const engine = new GrooveEngine();
    engineRef.current = engine;
    engine.sync(stateRef.current);
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.sync(state);
  }, [state]);

  useEffect(() => {
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
        setRecSec((current) => (current === seconds ? current : seconds));
        if (meter) paintMeter(meter, engine.isPlaying() || engine.isRecording() ? engine.readSpectrum() : null);
        if (engine.isRecording() && engine.recordingElapsed() >= 180 && !busy.current) {
          recordRef.current();
        }
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (fileRef.current) URL.revokeObjectURL(fileRef.current.url);
    };
  }, []);

  function patchLane(id: ChannelId, patch: Partial<Lane>) {
    setState((current) => ({
      ...current,
      lanes: { ...current.lanes, [id]: { ...current.lanes[id], ...patch } },
    }));
  }

  function toggleStep(id: ChannelId, index: number) {
    setState((current) => {
      const row = current.steps[id].slice();
      row[index] = !row[index];
      return { ...current, presetId: null, steps: { ...current.steps, [id]: row } };
    });
  }

  function applyPreset(preset: Preset) {
    setState((current) => ({
      ...current,
      presetId: preset.id,
      bpm: preset.bpm,
      bass: preset.bass.slice(),
      steps: {
        kick: preset.steps.kick.slice(),
        snare: preset.steps.snare.slice(),
        hat: preset.steps.hat.slice(),
        bass: preset.steps.bass.slice(),
      },
    }));
  }

  function clearGrid() {
    const blank = emptySteps();
    setState((current) => ({ ...current, presetId: null, steps: blank }));
  }

  function toggleSample(id: SampleId, index: number) {
    setState((current) => {
      const row = current.samples[id].slice();
      row[index] = !row[index];
      return { ...current, samples: { ...current.samples, [id]: row } };
    });
  }

  function stampSample() {
    if (!selected) return;
    const step = playhead;
    const id = selected;
    setState((current) => {
      const row = current.samples[id].slice();
      row[step] = true;
      return { ...current, samples: { ...current.samples, [id]: row } };
    });
  }

  function clearSamples() {
    setState((current) => ({ ...current, samples: emptySamples() }));
  }

  async function hitPad(id: SampleId) {
    setSelected(id);
    const engine = engineRef.current;
    if (!engine) return;
    try {
      await engine.playSample(id);
    } catch {
      setError("El audio no se pudo iniciar. Vuelve a pulsar el pad.");
    }
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
        const next = { url, name };
        fileRef.current = next;
        setFile(next);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setNote(
          result.extension === "wav"
            ? "Bucle listo. Si la descarga no empezó sola, usa el enlace."
            : `No se pudo empaquetar WAV. El audio está en ${result.extension}.`,
        );
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
    void onRecord();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, [role='slider']")) return;
      event.preventDefault();
      if (playingRef.current) onPause();
      else void onPlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allOff = CHANNEL_IDS.every((id) => state.steps[id].every((cell) => !cell));
  const recordLabel =
    phase === "encoding" ? "Codificando…" : recording ? "Detener y descargar" : "Grabar y exportar";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8">
      <section className="shell grid gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="mark" aria-hidden />
            <div>
              <h1 className="font-display text-4xl leading-none font-extrabold tracking-wide">VOLTA</h1>
              <p className="mt-1 text-sm text-muted">Máquina de groove · 16 pasos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest text-muted">PASO</p>
            <p className="font-display text-4xl leading-none font-extrabold tabular-nums">
              {String(playhead + 1).padStart(2, "0")}
            </p>
          </div>
        </header>

        <div className="deck-grid">
          <div className="transport-buttons flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" data-active={playing ? "true" : "false"} onClick={() => void onPlay()}>
              <Play className="size-4" aria-hidden />
              Reproducir
            </button>
            <button type="button" className="btn" onClick={onPause} disabled={!playing}>
              <Pause className="size-4" aria-hidden />
              Pausa
            </button>
            <button type="button" className="btn" onClick={clearGrid}>
              <RotateCcw className="size-4" aria-hidden />
              Limpiar
            </button>
          </div>

          <div className="rec-deck" data-live={recording ? "true" : "false"}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs tracking-widest text-muted uppercase">
                <span className="led" data-on={recording ? "true" : "false"} aria-hidden />
                {recording ? "Grabando" : "Grabación"}
              </span>
              <span className="font-display text-lg tabular-nums">{recording || phase === "encoding" ? formatClock(recSec) : "00:00"}</span>
            </div>
            <button type="button" className="btn btn-rec" onClick={() => void onRecord()} disabled={phase === "encoding"}>
              {recordLabel}
            </button>
            <p className="text-sm text-muted">Captura lo que suena y descarga un WAV.</p>
            {file ? (
              <a className="btn" href={file.url} download={file.name}>
                <Download className="size-4" aria-hidden />
                {file.name}
              </a>
            ) : null}
          </div>

          <div className="transport-sliders grid content-start gap-3">
            <label className="grid gap-1">
              <span className="flex items-center justify-between gap-3 text-xs tracking-widest text-muted uppercase">
                Tempo
                <span className="font-display text-base tracking-normal text-fg tabular-nums">{state.bpm} BPM</span>
              </span>
              <span className="flex items-center gap-2">
                <button type="button" className="mix" aria-label="Bajar tempo" onClick={() => setState((current) => ({ ...current, bpm: Math.max(60, current.bpm - 1) }))}>
                  <Minus className="size-4" aria-hidden />
                </button>
                <input
                  className="fader"
                  type="range"
                  min={60}
                  max={180}
                  value={state.bpm}
                  aria-label="Tempo en BPM"
                  suppressHydrationWarning
                  onChange={(event) => setState((current) => ({ ...current, bpm: Number(event.target.value) }))}
                />
                <button type="button" className="mix" aria-label="Subir tempo" onClick={() => setState((current) => ({ ...current, bpm: Math.min(180, current.bpm + 1) }))}>
                  <Plus className="size-4" aria-hidden />
                </button>
              </span>
            </label>

            <label className="grid gap-1">
              <span className="flex items-center justify-between text-xs tracking-widest text-muted uppercase">
                Salida
                <span className="tabular-nums text-fg">{Math.round(state.master * 100)}</span>
              </span>
              <input
                className="fader"
                type="range"
                min={0}
                max={100}
                value={Math.round(state.master * 100)}
                aria-label="Volumen de salida"
                suppressHydrationWarning
                onChange={(event) => setState((current) => ({ ...current, master: Number(event.target.value) / 100 }))}
              />
            </label>
          </div>
        </div>

        <div ref={meterRef} className="meter" aria-hidden>
          {Array.from({ length: METER_BARS }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {recording ? "Grabando audio" : phase === "encoding" ? "Codificando el bucle" : playing ? "Reproduciendo" : "En pausa"}
        </p>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-rec">
          {error}
        </p>
      ) : null}
      {note ? <p className="text-sm text-muted">{note}</p> : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pantallas">
        <button type="button" className="preset" role="tab" aria-selected={screen === "groove"} onClick={() => setScreen("groove")}>
          Groove
        </button>
        <button type="button" className="preset" role="tab" aria-selected={screen === "samples"} onClick={() => setScreen("samples")}>
          Samples
        </button>
      </div>

      {screen === "groove" ? (
      <>
      <section className="grid gap-3" aria-label="Patrones">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-xs tracking-widest text-muted uppercase">Patrones</p>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset"
              aria-pressed={state.presetId === preset.id}
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
        {allOff ? <p className="text-sm text-muted">La rejilla está vacía. Activa pasos o carga un patrón.</p> : null}
        <p className="text-xs text-muted">M silencia el canal. S lo aísla. La caída controla la duración de cada golpe.</p>
      </section>

      <section className="grid gap-3" aria-label="Secuenciador">
        {CHANNELS.map((channel) => {
          const lane = state.lanes[channel.id];
          const hit = playing && state.steps[channel.id][playhead];
          return (
            <article key={channel.id} className="lane" data-channel={channel.id} data-hit={hit ? "true" : "false"}>
              <div className="flex items-center gap-3">
                <div className="grid min-w-0 flex-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="pip" aria-hidden />
                    <h2 className="lane-name text-sm">{channel.label}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="mix"
                      aria-pressed={lane.mute}
                      aria-label={`Silenciar ${channel.hint}`}
                      onClick={() => patchLane(channel.id, { mute: !lane.mute })}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      className="mix"
                      aria-pressed={lane.solo}
                      aria-label={`Solo ${channel.hint}`}
                      onClick={() => patchLane(channel.id, { solo: !lane.solo })}
                    >
                      S
                    </button>
                  </div>
                  <label className="grid gap-1">
                    <span className="flex justify-between text-xs tracking-widest text-muted uppercase">
                      Volumen
                      <span className="tabular-nums">{Math.round(lane.volume * 100)}</span>
                    </span>
                    <input
                      className="fader"
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(lane.volume * 100)}
                      aria-label={`Volumen de ${channel.hint}`}
                      suppressHydrationWarning
                      onChange={(event) => patchLane(channel.id, { volume: Number(event.target.value) / 100 })}
                    />
                  </label>
                </div>
                <Knob
                  label={`Decay de ${channel.hint}`}
                  value={lane.decay}
                  onChange={(decay) => patchLane(channel.id, { decay })}
                />
              </div>
              <div className="step-strip" role="group" aria-label={`Pasos de ${channel.hint}`}>
                {[0, 1, 2, 3].map((group) => (
                  <div className="step-group" key={group}>
                    {[0, 1, 2, 3].map((offset) => {
                      const index = group * 4 + offset;
                      const on = state.steps[channel.id][index];
                      const now = playhead === index;
                      return (
                        <button
                          key={index}
                          type="button"
                          className="step"
                          data-on={on ? "true" : "false"}
                          data-now={now ? "true" : "false"}
                          aria-pressed={on}
                          aria-label={`${channel.label}, paso ${index + 1}${now ? ", actual" : ""}`}
                          onClick={() => toggleStep(channel.id, index)}
                        >
                          <span className="step-num">{index + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
      </>
      ) : (
      <section className="grid gap-3" aria-label="Samples">
        <div className="pad-grid">
          {SAMPLES.map((sample, index) => (
            <button
              key={sample.id}
              type="button"
              className="pad"
              data-channel={PAD_TONE[index % PAD_TONE.length]}
              data-on={selected === sample.id ? "true" : "false"}
              aria-pressed={selected === sample.id}
              onClick={() => void hitPad(sample.id)}
            >
              {sample.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={stampSample} disabled={!selected}>
            Pegar al paso
          </button>
          <button type="button" className="btn" onClick={clearSamples}>
            Vaciar samples
          </button>
        </div>
        <p className="text-xs text-muted">
          {selected
            ? `Pega ${SAMPLES.find((sample) => sample.id === selected)?.label ?? ""} en el paso ${String(playhead + 1).padStart(2, "0")}.`
            : "Toca un pad para oírlo encima del groove."}
        </p>
        {SAMPLES.map((sample, index) => (
          <article
            key={sample.id}
            className="sample-lane"
            data-channel={PAD_TONE[index % PAD_TONE.length]}
            data-hit={selected === sample.id ? "true" : "false"}
          >
            <h2 className="lane-name text-xs">{sample.label}</h2>
            <div className="step-strip" role="group" aria-label={`Pasos de ${sample.label}`}>
              {[0, 1, 2, 3].map((group) => (
                <div className="step-group" key={group}>
                  {[0, 1, 2, 3].map((offset) => {
                    const step = group * 4 + offset;
                    const on = state.samples[sample.id][step];
                    const now = playhead === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        className="step"
                        data-on={on ? "true" : "false"}
                        data-now={now ? "true" : "false"}
                        aria-pressed={on}
                        aria-label={`${sample.label}, paso ${step + 1}${now ? ", actual" : ""}`}
                        onClick={() => toggleSample(sample.id, step)}
                      >
                        <span className="step-num">{step + 1}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
      )}

      <p className="pb-2 text-center text-xs text-muted">Síntesis en el navegador · cuatro canales · exportación WAV</p>
    </main>
  );
}
