"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatTick, niceTicks } from "./ticks";
import type { Point } from "./gradient-line-chart";

const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 } as const;

/** Столбцы: до 24px шириной, скругление 4px на конце, растут от одной базовой линии. */
export function ColumnChart({
  data,
  unit,
  height = 200,
}: {
  data: Point[];
  unit: string;
  height?: number;
}) {
  const { ticks, domain } = niceTicks(0, Math.max(1, ...data.map((d) => d.value)), 4, true);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height }}>
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            interval="preserveStartEnd"
            minTickGap={24}
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
            cursor={{ fill: "var(--surface-2)", opacity: 0.6 }}
            content={(p) => <ChartTooltip {...p} unit={unit} />}
          />
          <Bar
            dataKey="value"
            fill="var(--accent)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
