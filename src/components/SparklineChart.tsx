'use client';

import { useMemo } from 'react';

interface SparklineChartProps {
  data: number[];
  color?: string; // Hex color or Tailwind class prefix logic
  height?: number;
  strokeWidth?: number;
}

export default function SparklineChart({ 
  data, 
  color = '#3b82f6', // Default Blue-500
  height = 60,
  strokeWidth = 2 
}: SparklineChartProps) {
  
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; // Avoid division by zero
    
    // Normalize data to fit height
    // Y coordinate is inverted (0 is top in SVG)
    // We add some padding (5px)
    const padding = 5;
    const effectiveHeight = height - padding * 2;

    return data.map((val, index) => {
      const x = (index / (data.length - 1)) * 100; // Percentage
      const normalizedY = ((val - min) / range); 
      const y = height - padding - (normalizedY * effectiveHeight);
      return `${x},${y}`;
    }).join(' ');
  }, [data, height]);

  const areaPoints = useMemo(() => {
      if (!points) return '';
      // Add bottom corners to close the path for filling
      return `${points} 100,${height} 0,${height}`;
  }, [points, height]);

  if (!data || data.length < 2) {
      return (
          <div className="flex items-center justify-center text-zinc-600 text-xs italic" style={{ height }}>
              Chưa đủ dữ liệu biểu đồ
          </div>
      );
  }

  return (
    <div className="w-full relative overflow-hidden" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
            <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
        </defs>

        {/* Area Fill */}
        <polygon 
            points={areaPoints} 
            fill={`url(#gradient-${color})`} 
        />

        {/* Line Stroke */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
