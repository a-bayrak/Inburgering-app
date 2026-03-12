interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  color?: 'primary' | 'green' | 'orange' | 'red';
  height?: 'thin' | 'normal' | 'thick';
  showLabel?: boolean;
  animated?: boolean;
}

const colorMap = {
  primary: 'bg-brand-primary',
  green: 'bg-green-500',
  orange: 'bg-orange-400',
  red: 'bg-red-500',
};

const heightMap = {
  thin: 'h-1',
  normal: 'h-2',
  thick: 'h-3',
};

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  height = 'normal',
  showLabel = false,
  animated = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightMap[height]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color]} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
