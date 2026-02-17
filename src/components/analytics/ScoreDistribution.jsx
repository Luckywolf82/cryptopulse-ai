import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ScoreDistribution({ signals, groupBy = "symbol" }) {
  const chartData = useMemo(() => {
    const groups = new Map();

    signals.forEach(signal => {
      const key = groupBy === "symbol" ? signal.symbol : signal.timeframe;
      
      if (!groups.has(key)) {
        groups.set(key, {
          name: key,
          count: 0,
          totalScore: 0,
          highQuality: 0
        });
      }

      const group = groups.get(key);
      group.count++;
      group.totalScore += signal.score;
      if (signal.score >= 70) group.highQuality++;
    });

    // Calculate average score and convert to array
    return Array.from(groups.values())
      .map(g => ({
        ...g,
        avgScore: Math.round(g.totalScore / g.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [signals, groupBy]);

  const title = groupBy === "symbol" 
    ? "Gjennomsnittlig score per symbol (top 10)" 
    : "Gjennomsnittlig score per tidshorisont";

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="avgScore" 
              fill="#3b82f6" 
              name="Gj.snitt score"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="count" 
              fill="#10b981" 
              name="Antall signaler"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}