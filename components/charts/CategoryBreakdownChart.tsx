"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryBreakdownProps {
  relevance: number;
  technical: number;
  completeness: number;
  communication: number;
}

export function CategoryBreakdownChart({
  relevance,
  technical,
  completeness,
  communication,
}: CategoryBreakdownProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: "Technical", score: technical, color: "#8B5CF6" },
    { name: "Communication", score: communication, color: "#22D3EE" },
    { name: "Relevance", score: relevance, color: "#6366F1" },
    { name: "Completeness", score: completeness, color: "#34D399" },
  ];

  if (!mounted) {
    return <div className="w-full h-56 bg-card/40 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="w-full h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#F8FAFC",
            }}
            formatter={(val: any) => [`${val}%`, "Score"]}
          />
          <Bar dataKey="score" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
