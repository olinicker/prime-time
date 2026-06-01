/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { formatWorkedTime } from '../utils/formatters';

interface ChartDataPoint {
  label: string;
  value: number; // in minutes
  tooltip?: string;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
}

export const WeeklyHoursChart: React.FC<PerformanceChartProps> = ({ data, title, subtitle }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
        Sem dados correspondentes no período.
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 480); // baseline to 8h minimum
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 35;
  
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h4 className="text-zinc-200 text-sm font-semibold tracking-tight">{title}</h4>
          {subtitle && <p className="text-zinc-500 text-xs font-mono">{subtitle}</p>}
        </div>
        {hoveredIndex !== null && (
          <div className="text-emerald-400 font-mono text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            {data[hoveredIndex].label}: {formatWorkedTime(data[hoveredIndex].value)}
          </div>
        )}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padding + graphHeight * (1 - ratio);
            const valueLabel = Math.round((maxValue * ratio) / 60) + 'h';
            return (
              <g key={idx}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {valueLabel}
                </text>
              </g>
            );
          })}

          {/* Bar Chart rendering */}
          {data.map((item, idx) => {
            const barWidth = Math.min(graphWidth / data.length * 0.6, 32);
            const x = padding + (idx * (graphWidth / data.length)) + (graphWidth / data.length - barWidth) / 2;
            const height = (item.value / maxValue) * graphHeight;
            const y = padding + graphHeight - height;
            
            const isHovered = hoveredIndex === idx;
            const isEightHours = item.value >= 480; // completed workday indicator

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Background active glow for hovered bar */}
                {isHovered && (
                  <rect
                    x={x - 6}
                    y={padding - 5}
                    width={barWidth + 12}
                    height={graphHeight + 10}
                    fill="rgba(16, 185, 129, 0.03)"
                    rx="6"
                  />
                )}

                {/* Animated bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(height, 2)}
                  rx="4"
                  fill={isHovered ? '#34d399' : isEightHours ? '#10b981' : '#f59e0b'}
                  className="transition-all duration-300"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Bottom X label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 12}
                  fill={isHovered ? '#f4f4f5' : '#71717a'}
                  fontSize="9"
                  fontWeight={isHovered ? '600' : '400'}
                  textAnchor="middle"
                  className="transition-colors duration-200"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const BalanceTrendChart: React.FC<PerformanceChartProps> = ({ data, title, subtitle }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
        Sem dados históricos.
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values, 0) - 30; // padding
  const maxVal = Math.max(...values, 120) + 30; // padding
  const valRange = maxVal - minVal;

  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 35;
  
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  // Calculate coordinates
  const points = data.map((item, idx) => {
    const x = padding + (idx * (graphWidth / (data.length - 1 || 1)));
    const y = padding + graphHeight - ((item.value - minVal) / valRange) * graphHeight;
    return { x, y, value: item.value, label: item.label };
  });

  // Create SVG path string for modern Bezier curve
  let pathStr = '';
  if (points.length > 0) {
    pathStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cpX1 = p1.x + (p2.x - p1.x) / 3;
      const cpY1 = p1.y;
      const cpX2 = p1.x + (2 * (p2.x - p1.x)) / 3;
      const cpY2 = p2.y;
      pathStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p2.x} ${p2.y}`;
    }
  }

  // Create filled Area under the curve path string
  const areaPathStr = points.length > 0
    ? `${pathStr} L ${points[points.length - 1].x} ${padding + graphHeight} L ${points[0].x} ${padding + graphHeight} Z`
    : '';

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h4 className="text-zinc-200 text-sm font-semibold tracking-tight">{title}</h4>
          {subtitle && <p className="text-zinc-500 text-xs font-mono">{subtitle}</p>}
        </div>
        {hoveredIndex !== null && (
          <div className="text-emerald-400 font-mono text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            {points[hoveredIndex].label}: {points[hoveredIndex].value > 0 ? '+' : ''}{points[hoveredIndex].value} min
          </div>
        )}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Zero balance indicator */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={padding}
              y1={padding + graphHeight - ((0 - minVal) / valRange) * graphHeight}
              x2={chartWidth - padding}
              y2={padding + graphHeight - ((0 - minVal) / valRange) * graphHeight}
              stroke="#eb5757"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.4"
            />
          )}

          {/* Grids */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padding + graphHeight * (1 - ratio);
            const val = minVal + valRange * ratio;
            return (
              <g key={idx}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 8}
                  y={y + 3}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {Math.round(val)}m
                </text>
              </g>
            );
          })}

          {/* Glowing Area Fill under line */}
          {areaPathStr && (
            <path
              d={areaPathStr}
              fill="url(#areaGlow)"
              opacity="0.2"
            />
          )}

          {/* Core Curve Path */}
          {pathStr && (
            <path
              d={pathStr}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Grid interactive nodes */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible larger hover node target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="12"
                  fill="transparent"
                />
                {/* Core node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : '3.5'}
                  fill={isHovered ? '#34d399' : '#10b981'}
                  stroke="#18181b"
                  strokeWidth="1.5"
                  className="transition-all duration-300"
                />
                {/* Bottom label */}
                <text
                  x={pt.x}
                  y={chartHeight - 12}
                  fill={isHovered ? '#f4f4f5' : '#71717a'}
                  fontSize="9"
                  textAnchor="middle"
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
