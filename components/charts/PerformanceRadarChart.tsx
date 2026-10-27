"use client";

import * as React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface PerformanceRadarProps {
  relevance: number;
  technical: number;
  completeness: number;
  communication: number;
  reasoning: number;
}

export function PerformanceRadarChart({
  relevance,
  technical,
  completeness,
  communication,
  reasoning,
}: PerformanceRadarProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { subject: "Technical Accuracy", score: technical, fullMark: 100 },
    { subject: "Communication", score: communication, fullMark: 100 },
    { subject: "Completeness", score: completeness, fullMark: 100 },
    { subject: "Relevance", score: relevance, fullMark: 100 },
    { subject: "Reasoning", score: reasoning, fullMark: 100 },
  ];

  if (!mounted) {
    return <div className="w-full h-64 bg-card/40 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "sans-serif" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#64748B", fontSize: 9 }}
            stroke="rgba(255, 255, 255, 0.05)"
          />
          <Radar
            name="Candidate Competency"
            dataKey="score"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
