interface SparklineProps {
  data: number[];
  positive?: boolean;
  className?: string;
  id?: string;
}

export function Sparkline({ data, positive = true, className = "", id = "spark" }: SparklineProps) {
  const width = 160;
  const height = 48;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  const lastPoint = points.split(" ").at(-1)?.split(",") ?? [width, height / 2];
  const color = positive ? "#18d39e" : "#ff5c68";
  const gradientId = `${id}-${positive ? "up" : "down"}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.5" fill={color} />
    </svg>
  );
}
