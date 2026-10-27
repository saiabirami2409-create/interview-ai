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

interface SkillGapItem {
  name: string;
  mastery: number; // 0 - 100
  priority: string;
}

export function SkillGapBarChart({ data }: { data: SkillGapItem[] }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-56 bg-card/40 rounded-2xl animate-pulse" />;
  }

  const chartData = data.length > 0 ? data : [
    { name: "SQL Indexing", mastery: 45, priority: "HIGH" },
    { name: "STAR Format", mastery: 60, priority: "MEDIUM" },
    { name: "Graph Traversal", mastery: 50, priority: "HIGH" },
    { name: "React State", mastery: 85, priority: "LOW" },
  ];

  const getColor = (mastery: number) => {
    if (mastery >= 75) return "#34D399"; // green
    if (mastery >= 55) return "#22D3EE"; // cyan
    return "#F43F5E"; // rose/alert
  };

  return (
    <div className="w-full h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            angle={-20}
            textAnchor="end"
            interval={0}
          />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#F8FAFC",
            }}
            formatter={(val: any) => [`${val}% Mastery`, "Proficiency"]}
          />
          <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.mastery)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
