import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

export default function StatsCards({ signals, paperTrades }) {
  const totalSignals = signals.length;
  const averageScore = signals.length > 0 
    ? (signals.reduce((sum, s) => sum + s.score, 0) / signals.length).toFixed(1)
    : 0;
  
  const highQualitySignals = signals.filter(s => s.score >= 70).length;
  const highQualityPercent = totalSignals > 0 
    ? ((highQualitySignals / totalSignals) * 100).toFixed(1)
    : 0;

  const closedTrades = paperTrades.filter(t => t.status === 'closed');
  const profitableTrades = closedTrades.filter(t => t.pnlUsd > 0).length;
  const winRate = closedTrades.length > 0
    ? ((profitableTrades / closedTrades.length) * 100).toFixed(1)
    : 0;

  const stats = [
    {
      title: "Totalt signaler",
      value: totalSignals,
      icon: Activity,
      color: "text-blue-400"
    },
    {
      title: "Gjennomsnittlig score",
      value: averageScore,
      icon: Target,
      color: "text-purple-400"
    },
    {
      title: "Høykvalitetssignaler",
      value: `${highQualityPercent}%`,
      subtitle: `${highQualitySignals} av ${totalSignals}`,
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      title: "Vinnerrate",
      value: closedTrades.length > 0 ? `${winRate}%` : "N/A",
      subtitle: `${profitableTrades} av ${closedTrades.length} handler`,
      icon: TrendingDown,
      color: winRate >= 50 ? "text-green-400" : "text-red-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
              <stat.icon className={`w-10 h-10 ${stat.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}