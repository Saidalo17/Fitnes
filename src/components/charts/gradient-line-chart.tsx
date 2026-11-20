"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatTick, niceTicks } from "./ticks";

export type Point = { label: string; value: number };

const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 } as const;

/**
 * Линия с градиентной заливкой (design.md): 2px, цвет акцента, заливка-«вуаль»,
 * тонкая сетка, точка на последнем значении с кольцом цвета поверхности.
 */
export function GradientLineChart({
  data,
  unit,
  height = 220,
  zeroBased = false,
}: {
  data: Point[];
  unit: string;
  height?: number;
  zeroBased?: boolean;
}) {
  const gid = `g${useId().replace(/:/g, "")}`;
  const last = data.length - 1;
  const values = data.map((d) => d.value);
  const lo = zeroBased ? 0 : Math.floor(Math.min(...values, Infinity) - 1);
  const hi = Math.max(
    zeroBased ? 1 : Math.ceil(Math.max(...values, -Infinity) + 1),
    ...(zeroBased ? values : []),
  );
  const { ticks, domain } = niceTicks(Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : 1);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height }}>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            ticks={ticks}
            domain={domain}
            tickFormatter={formatTick}
          />
          <Tooltip
            cursor={{ stroke: "var(--line)" }}
            content={(p) => <ChartTooltip {...p} unit={unit} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${gid})`}
            dot={(p) => {
              const { cx, cy, index } = p as { cx: number; cy: number; index: number };
              return index === last ? (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="var(--accent)"
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ) : (
                <g key={index} />
              );
            }}
            activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
