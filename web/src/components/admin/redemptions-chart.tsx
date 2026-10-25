"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { day: string; redemptions: number };

const fmtDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Resgates por dia (série única: sem legenda, o título nomeia). */
export function RedemptionsChart({ data }: { data: Point[] }) {
  const total = data.reduce((s, d) => s + d.redemptions, 0);
  return (
    <figure>
      <div className="h-64 w-full" role="img" aria-label={`Resgates por dia nos últimos 30 dias: ${total} no total.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.07)" />
            <XAxis
              dataKey="day"
              tickFormatter={fmtDay}
              tick={{ fill: "#9a9a9a", fontSize: 11 }}
              axisLine={{ stroke: "rgb(255 255 255 / 0.16)" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis allowDecimals={false} tick={{ fill: "#9a9a9a", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              cursor={{ fill: "rgb(255 255 255 / 0.06)" }}
              contentStyle={{ background: "#121212", border: "1px solid rgb(255 255 255 / 0.25)", borderRadius: 6 }}
              labelStyle={{ color: "#a3a3a3" }}
              itemStyle={{ color: "#f2f2f0" }}
              labelFormatter={(d) => fmtDay(String(d))}
              formatter={(v) => [v, "Resgates"]}
            />
            <Bar dataKey="redemptions" fill="#f2f2f0" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-ash">
        <summary className="cursor-pointer">Ver tabela</summary>
        <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 sm:grid-cols-6">
          {data.map((d) => (
            <span key={d.day} className="tabular-nums">
              {fmtDay(d.day)}: <b className="text-paper">{d.redemptions}</b>
            </span>
          ))}
        </div>
      </details>
    </figure>
  );
}
