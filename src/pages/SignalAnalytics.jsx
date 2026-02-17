import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import SignalFrequencyChart from "../components/analytics/SignalFrequencyChart";
import ScoreDistribution from "../components/analytics/ScoreDistribution";
import PerformanceMetrics from "../components/analytics/PerformanceMetrics";
import StatsCards from "../components/analytics/StatsCards";

export default function SignalAnalyticsPage() {
  const { t } = useTranslation();
  const [signals, setSignals] = useState([]);
  const [paperTrades, setPaperTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [signalsData, tradesData] = await Promise.all([
        base44.entities.Signal.list("-created_date", 500),
        base44.entities.PaperTrade.list("-created_date", 500)
      ]);
      setSignals(signalsData);
      setPaperTrades(tradesData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{t('analytics.title')}</h1>
            <p className="text-slate-300">{t('analytics.subtitle')}</p>
          </div>
          <Button
            onClick={loadData}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('analytics.update')}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-400 mt-4">{t('analytics.loadingData')}</p>
          </div>
        ) : signals.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t('analytics.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <StatsCards signals={signals} paperTrades={paperTrades} />

            {/* Signal Frequency Over Time */}
            <SignalFrequencyChart signals={signals} />

            {/* Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreDistribution signals={signals} groupBy="symbol" />
              <ScoreDistribution signals={signals} groupBy="timeframe" />
            </div>

            {/* Performance Metrics */}
            <PerformanceMetrics signals={signals} paperTrades={paperTrades} />
          </div>
        )}
      </div>
    </div>
  );
}