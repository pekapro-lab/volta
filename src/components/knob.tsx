import { useRef } from "react";

type KnobProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function Knob({ label, value, onChange }: KnobProps) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const angle = -135 + value * 270;

  return (
    <div className="knob-wrap">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-orientation="vertical"
        className="knob"
        onPointerDown={(event) => {
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { y: event.clientY, v: value };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          onChange(clamp(drag.current.v + (drag.current.y - event.clientY) / 110));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
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
        }}
      >
        <span className="knob-rotor" style={{ transform: `rotate(${angle}deg)` }} />
      </div>
      <span className="knob-caption">
        Decay
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </span>
    </div>
  );
}
