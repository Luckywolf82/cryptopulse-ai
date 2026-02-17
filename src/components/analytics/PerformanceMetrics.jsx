import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function PerformanceMetrics({ signals, paperTrades }) {
  const performanceByTrigger = useMemo(() => {
    const triggerTypes = ['EMA_FLIP', 'MSS', 'RSI_DIV'];
    
    return triggerTypes.map(triggerType => {
      const triggerSignals = signals.filter(s => s.triggerType === triggerType);
      const triggerTrades = paperTrades.filter(trade => {
        const signal = signals.find(s => 
          s.symbol === trade.symbol && 
          s.triggerType === triggerType &&
          Math.abs(new Date(s.created_date).getTime() - new Date(trade.openedAt).getTime()) < 60000
        );
        return signal && trade.status === 'closed';
      });

      const profitable = triggerTrades.filter(t => t.pnlUsd > 0).length;
      const totalTrades = triggerTrades.length;
      const winRate = totalTrades > 0 ? ((profitable / totalTrades) * 100).toFixed(1) : 0;
      const avgPnl = totalTrades > 0 
        ? (triggerTrades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0) / totalTrades).toFixed(2)
        : 0;

      return {
        triggerType,
        signalCount: triggerSignals.length,
        avgScore: triggerSignals.length > 0 
          ? (triggerSignals.reduce((sum, s) => sum + s.score, 0) / triggerSignals.length).toFixed(1)
          : 0,
        totalTrades,
        profitable,
        winRate,
        avgPnl
      };
    });
  }, [signals, paperTrades]);

  const getTriggerLabel = (type) => {
    switch(type) {
      case 'EMA_FLIP': return 'EMA Crossover';
      case 'MSS': return 'Market Structure Shift';
      case 'RSI_DIV': return 'RSI Divergence';
      default: return type;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">Ytelse per signaltype</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performanceByTrigger.map((metric) => (
            <div key={metric.triggerType} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{getTriggerLabel(metric.triggerType)}</h3>
                  <p className="text-sm text-slate-400">
                    {metric.signalCount} signaler • Gj.snitt score: {metric.avgScore}
                  </p>
                </div>
                <Badge className={`${
                  metric.winRate >= 50 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {metric.winRate}% vinnerrate
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Papirhandler</p>
                  <p className="text-lg font-bold text-white">{metric.totalTrades}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Vinnende</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <p className="text-lg font-bold text-green-400">{metric.profitable}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Gj.snitt P/L</p>
                  <div className="flex items-center gap-1">
                    {metric.avgPnl >= 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <p className="text-lg font-bold text-green-400">${metric.avgPnl}</p>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <p className="text-lg font-bold text-red-400">${metric.avgPnl}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}