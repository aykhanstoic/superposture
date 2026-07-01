interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: SliderProps) {
  return (
    <div className="py-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="text-sm tabular-nums text-white/50">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent"
      />
    </div>
  );
}
