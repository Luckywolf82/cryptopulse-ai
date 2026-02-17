import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Analysis } from "@/entities/Analysis";
import { StockAnalysis } from "@/entities/StockAnalysis";
import { TradeResult } from "@/entities/TradeResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Filter, Eye, RefreshCw, BarChart3, Zap, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import HistoryFilters from "../components/history/HistoryFilters";
import AnalysisCard from "../components/history/AnalysisCard";
import AnalysisModal from "../components/history/AnalysisModal";

export default function History() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allAnalyses, setAllAnalyses] = useState([]);
  const [tradeResults, setTradeResults] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [performances, setPerformances] = useState([]);
  const [hoursBack, setHoursBack] = useState(168);
  const [filters, setFilters] = useState({
    tradingType: "all",
    riskLevel: "all", 
    dateRange: "all",
    resultStatus: "all"
  });

  useEffect(() => {
    loadAnalyses();
    loadPerformances();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allAnalyses, filters, tradeResults]);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      console.log("Loading analyses...");
      
      const [cryptoData, stockData, resultsData] = await Promise.all([
        Analysis.list("-created_date", 100), // Get more records
        StockAnalysis.list("-created_date", 100), // Get more records  
        TradeResult.list("-created_date", 100)
      ]);
      
      console.log("Crypto analyses:", cryptoData.length);
      console.log("Stock analyses:", stockData.length);
      console.log("Trade results:", resultsData.length);
      
      const combinedAnalyses = [
        ...cryptoData.map(a => ({...a, analysis_type: 'crypto'})),
        ...stockData.map(a => ({...a, analysis_type: 'stock'}))
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      console.log("Total combined analyses:", combinedAnalyses.length);
      
      setAllAnalyses(combinedAnalyses);
      setTradeResults(resultsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading analyses:", error);
      setIsLoading(false);
    }
  };

  const loadPerformances = async () => {
    try {
      const perf = await base44.entities.SignalPerformance.list("-created_date", 100);
      setPerformances(perf);
    } catch (error) {
      console.error("Error loading performances:", error);
    }
  };

  const runEvaluation = async () => {
    setIsEvaluating(true);
    try {
      await base44.functions.invoke("evaluatePerformance", { hoursBack });
      await loadPerformances();
    } catch (error) {
      console.error("Error running evaluation:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const applyFilters = () => {
    console.log("Applying filters to", allAnalyses.length, "analyses");
    let filtered = [...allAnalyses];

    if (filters.tradingType !== "all") {
      if (filters.tradingType === "stock") {
        filtered = filtered.filter(a => a.analysis_type === 'stock');
      } else {
        filtered = filtered.filter(a => a.analysis_type === 'crypto' && a.trading_type === filters.tradingType);
      }
    }

    if (filters.riskLevel !== "all") {
      filtered = filtered.filter(a => {
        const riskLevel = a.risk_level || a.investment_recommendation?.risk_level;
        return riskLevel === filters.riskLevel;
      });
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(a => new Date(a.created_date) >= filterDate);
    }

    // Add trade results to analyses
    filtered = filtered.map(analysis => {
      const result = tradeResults.find(r => r.analysis_id === analysis.id);
      return { ...analysis, trade_result: result };
    });

    if (filters.resultStatus !== "all") {
      if (filters.resultStatus === "tracked") {
        filtered = filtered.filter(a => a.trade_result);
      } else if (filters.resultStatus === "untracked") {
        filtered = filtered.filter(a => !a.trade_result);
      } else if (["SUCCESS", "FAILED", "ONGOING"].includes(filters.resultStatus)) {
        filtered = filtered.filter(a => a.trade_result?.result_status === filters.resultStatus);
      }
    }

    console.log("Filtered analyses:", filtered.length);
    setFilteredAnalyses(filtered);
  };

  const getSuccessRate = () => {
    const trackedResults = tradeResults.filter(r => r.result_status !== 'ONGOING');
    const successCount = trackedResults.filter(r => r.result_status === 'SUCCESS').length;
    return trackedResults.length > 0 ? (successCount / trackedResults.length) * 100 : 0;
  };
  
  const totalAnalysisCount = allAnalyses.length;
  const profitableCount = tradeResults.filter(r => r.result_status === 'SUCCESS').length;
  const lossCount = tradeResults.filter(r => r.result_status === 'FAILED').length;

  const handleResultUpdate = async () => {
    const resultsData = await TradeResult.list("-created_date", 100);
    setTradeResults(resultsData);
  };

  // Performance stats
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 md:mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="border-slate-700 hover:bg-slate-800 md:hidden"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">{t('history.title')}</h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base">{t('history.subtitle')}</p>
          </div>
          <Button
            onClick={loadAnalyses}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </motion.div>

        {/* Tabs for History and Performance */}
        <Tabs value="history" onValueChange={() => {}} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="history" className="text-slate-300 data-[state=active]:text-white">History</TabsTrigger>
            <TabsTrigger value="performance" className="text-slate-300 data-[state=active]:text-white">Performance</TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* Success Rate Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-effect border-slate-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-white">{totalAnalysisCount}</div>
                      <div className="text-slate-400 text-xs md:text-sm">{t('history.stats.totalAnalysis')}</div>
                    </div>
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-emerald-400">{getSuccessRate().toFixed(1)}%</div>
                      <div className="text-slate-400 text-xs md:text-sm">{t('history.stats.successRate')}</div>
                    </div>
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-blue-400">
                        {profitableCount}
                      </div>
                      <div className="text-slate-400 text-xs md:text-sm">{t('history.stats.profitable')}</div>
                    </div>
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-red-400">
                        {lossCount}
                      </div>
                      <div className="text-slate-400 text-xs md:text-sm">{t('history.stats.losses')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <HistoryFilters filters={filters} onFiltersChange={setFilters} />
            </motion.div>

            {/* Analysis Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="glass-effect border-slate-700 animate-pulse">
                    <CardContent className="p-4 md:p-6">
                      <div className="w-full h-32 md:h-40 bg-slate-700 rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700 rounded w-3/4" />
                        <div className="h-4 bg-slate-700 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allAnalyses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="glass-effect border-slate-700">
                  <CardContent className="p-8 md:p-12 text-center">
                    <Eye className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                      {t('history.noAnalysis')}
                    </h3>
                    <p className="text-slate-400 mb-6">
                      {t('history.noAnalysisDesc')}
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => navigate(createPageUrl("Analyze"))}
                        className="bg-blue-600 hover:bg-blue-700 mr-2"
                      >
                        {t('history.analyzeCrypto')}
                      </Button>
                      <Button
                        onClick={() => navigate(createPageUrl("StockAnalysis"))}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('history.analyzeStocks')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : filteredAnalyses.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                {filteredAnalyses.map((analysis) => (
                  <motion.div
                    key={analysis.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <AnalysisCard 
                      analysis={analysis}
                      tradeResult={analysis.trade_result}
                      onClick={() => setSelectedAnalysis(analysis)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="glass-effect border-slate-700">
                  <CardContent className="p-8 md:p-12 text-center">
                    <Filter className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                      {t('history.noMatch')}
                    </h3>
                    <p className="text-slate-400 mb-6">
                      {t('history.noMatchDesc')}
                    </p>
                    <Button
                      onClick={() => setFilters({ tradingType: "all", riskLevel: "all", dateRange: "all", resultStatus: "all" })}
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-800"
                    >
                      Reset Filter
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Evaluation Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
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
                    onClick={runEvaluation}
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <Card className="bg-slate-800/50 border-slate-700">
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
                    onClick={runEvaluation}
                    disabled={isEvaluating}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Run Evaluation
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Note: Analysis grid below is shown in History tab via TabsContent */}
        <div className="hidden">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="glass-effect border-slate-700 animate-pulse">
                <CardContent className="p-4 md:p-6">
                  <div className="w-full h-32 md:h-40 bg-slate-700 rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-700 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allAnalyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardContent className="p-8 md:p-12 text-center">
                <Eye className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                  {t('history.noAnalysis')}
                </h3>
                <p className="text-slate-400 mb-6">
                  {t('history.noAnalysisDesc')}
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate(createPageUrl("Analyze"))}
                    className="bg-blue-600 hover:bg-blue-700 mr-2"
                  >
                    {t('history.analyzeCrypto')}
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("StockAnalysis"))}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t('history.analyzeStocks')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredAnalyses.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {filteredAnalyses.map((analysis) => (
              <motion.div
                key={analysis.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <AnalysisCard 
                  analysis={analysis}
                  tradeResult={analysis.trade_result}
                  onClick={() => setSelectedAnalysis(analysis)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardContent className="p-8 md:p-12 text-center">
                <Filter className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                  {t('history.noMatch')}
                </h3>
                <p className="text-slate-400 mb-6">
                  {t('history.noMatchDesc')}
                </p>
                <Button
                  onClick={() => setFilters({ tradingType: "all", riskLevel: "all", dateRange: "all", resultStatus: "all" })}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  Reset Filter
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        </div>

        {/* Analysis Detail Modal */}
        <AnalysisModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          onResultUpdate={handleResultUpdate}
        />
      </div>
    </div>
  );
}