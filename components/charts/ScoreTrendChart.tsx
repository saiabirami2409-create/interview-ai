"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScoreTrendProps {
  data: Array<{
    date: string;
    score: number;
    title: string;
  }>;
}

export function ScoreTrendChart({ data }: ScoreTrendProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-56 bg-card/40 rounded-2xl animate-pulse" />;
  }

  const chartData = data.length > 0 ? data : [
    { date: "Session 1", score: 68, title: "Diagnostic Mock" },
    { date: "Session 2", score: 75, title: "Technical Round" },
    { date: "Session 3", score: 81, title: "Full-Stack Mock" },
  ];

  return (
    <div className="w-full h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#8B5CF6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#F8FAFC",
            }}
            formatter={(val: any) => [`${val}/100`, "Score"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#8B5CF6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#scoreGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
