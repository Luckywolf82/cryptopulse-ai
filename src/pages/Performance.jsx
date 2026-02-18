import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react";

export default function PerformancePage() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [hoursBack, setHoursBack] = useState(168); // 1 week

  const queryClient = useQueryClient();

  const { data: performances = [], refetch } = useQuery({
    queryKey: ["signalPerformances"],
    queryFn: async () => {
      const data = await base44.entities.SignalPerformance.list("-created_date", 5000);
      console.log(`📊 Fetched ${data.length} performances:`, data.slice(0, 3));
      return data;
    },
  });

  // Real-time subscription to auto-update when new performances are created
  useEffect(() => {
    const unsubscribe = base44.entities.SignalPerformance.subscribe((event) => {
      console.log(`🔔 SignalPerformance event:`, event.type, event.data?.symbol);
      if (event.type === 'create') {
        refetch();
      }
    });
    return unsubscribe;
  }, [refetch]);

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      setIsEvaluating(true);
      console.log(`🚀 Starting evaluation for ${hoursBack} hours back, ruleVersion: v2`);
      const res = await base44.functions.invoke("evaluatePerformance", { hoursBack, maxSignals: 5 });
      console.log(`✅ Evaluation response:`, res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log(`📈 Evaluated ${data.evaluated} signals, errors: ${data.errors}`);
      console.log(`🔄 Refetching performances...`);
      queryClient.invalidateQueries({ queryKey: ["signalPerformances"] });
      setIsEvaluating(false);
    },
    onError: (error) => {
      console.error(`❌ Evaluation error:`, error);
      setIsEvaluating(false);
    },
  });

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (performances.length === 0) {
      return { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0, avgPnl: 0, avgRMultiple: 0 };
    }

    const total = performances.length;
    const wins = performances.filter(p => p.status === "win").length;
    const losses = performances.filter(p => p.status === "loss").length;
    const breakeven = total - wins - losses;
    const winRate = ((wins / total) * 100).toFixed(1);
    const avgPnl = (performances.reduce((sum, p) => sum + (p.pnlPercent || 0), 0) / total).toFixed(2);
    const avgRMultiple = (performances.reduce((sum, p) => sum + (p.rMultiple || 0), 0) / total).toFixed(2);

    return { total, wins, losses, breakeven, winRate, avgPnl, avgRMultiple };
  }, [performances]);

  // Group by trigger type and timeframe
  const grouped = React.useMemo(() => {
    const groups = {};
    
    performances.forEach(p => {
      const key = `${p.triggerType}|${p.timeframe}`;
      if (!groups[key]) {
        groups[key] = {
          triggerType: p.triggerType,
          timeframe: p.timeframe,
          signals: [],
        };
      }
      groups[key].signals.push(p);
    });

    return Object.values(groups).map(group => {
      const total = group.signals.length;
      const wins = group.signals.filter(s => s.status === "win").length;
      const avgPnl = (group.signals.reduce((sum, s) => sum + (s.pnlPercent || 0), 0) / total).toFixed(2);
      const avgRMultiple = (group.signals.reduce((sum, s) => sum + (s.rMultiple || 0), 0) / total).toFixed(2);
      
      return { ...group, total, wins, winRate: ((wins / total) * 100).toFixed(1), avgPnl, avgRMultiple };
    });
  }, [performances]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
          </div>
          <p className="text-slate-300">Track and analyze the performance of generated trading signals</p>
        </div>

        {/* Evaluation Controls */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Run Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Hours Lookback</label>
                <select
                  value={hoursBack}
                  onChange={(e) => setHoursBack(parseInt(e.target.value))}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                >
                  <option value={24}>24 hours</option>
                  <option value={168}>1 week</option>
                  <option value={720}>1 month</option>
                  <option value={8760}>1 year</option>
                </select>
              </div>
              <Button
                onClick={() => evaluateMutation.mutate()}
                disabled={isEvaluating}
                className="bg-emerald-500 hover:bg-emerald-600 text-white mt-6"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Evaluation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {performances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Wins</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.wins}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Losses</p>
                  <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.winRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Avg P/L %</p>
                  <p className={`text-2xl font-bold ${parseFloat(stats.avgPnl) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {stats.avgPnl}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Avg R:Multiple</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.avgRMultiple}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grouped Statistics */}
        {grouped.length > 0 && (
          <Card className="mb-6 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Performance by Trigger Type & Timeframe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-300 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3 px-4">Trigger Type</th>
                      <th className="text-left py-3 px-4">Timeframe</th>
                      <th className="text-center py-3 px-4">Signals</th>
                      <th className="text-center py-3 px-4">Wins</th>
                      <th className="text-center py-3 px-4">Win Rate</th>
                      <th className="text-center py-3 px-4">Avg P/L %</th>
                      <th className="text-center py-3 px-4">Avg R:Multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((group, idx) => (
                      <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="py-3 px-4 text-white font-medium">{group.triggerType}</td>
                        <td className="py-3 px-4 text-slate-300">{group.timeframe}</td>
                        <td className="py-3 px-4 text-center text-slate-300">{group.total}</td>
                        <td className="py-3 px-4 text-center text-emerald-400 font-medium">{group.wins}</td>
                        <td className="py-3 px-4 text-center text-blue-400">{group.winRate}%</td>
                        <td className={`py-3 px-4 text-center font-medium ${parseFloat(group.avgPnl) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {group.avgPnl}%
                        </td>
                        <td className="py-3 px-4 text-center text-purple-400">{group.avgRMultiple}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Performances */}
        {performances.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Trade Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {performances.slice(0, 20).map((perf) => (
                  <div key={perf.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div>
                        <p className="text-white font-medium">{perf.symbol}</p>
                        <p className="text-xs text-slate-400">{perf.triggerType} • {perf.timeframe}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`font-bold ${perf.status === "win" ? "text-emerald-400" : perf.status === "loss" ? "text-red-400" : "text-slate-300"}`}>
                          {perf.pnlPercent > 0 ? "+" : ""}{perf.pnlPercent}%
                        </p>
                        <p className="text-xs text-slate-400">R:{perf.rMultiple}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{perf.holdingHours}h</p>
                        <p className={`text-xs font-medium ${perf.status === "win" ? "text-emerald-400" : perf.status === "loss" ? "text-red-400" : "text-slate-300"}`}>
                          {perf.exitReason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {performances.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700 text-center py-12">
            <CardContent>
              <p className="text-slate-400 mb-4">No performance data yet. Run an evaluation to get started.</p>
              <Button
                onClick={() => evaluateMutation.mutate()}
                disabled={isEvaluating}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Run Evaluation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}