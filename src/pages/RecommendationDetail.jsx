import React, { useState, useEffect } from "react";
import { TradingRecommendation } from "@/entities/TradingRecommendation";
import { TradeResult } from "@/entities/TradeResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, TrendingUp, Zap, Newspaper, Target, Shield, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import DCACalculator from "../components/investment/DCACalculator";
import TradeResultTracker from "../components/investment/TradeResultTracker";

export default function RecommendationDetail() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [tradeResult, setTradeResult] = useState(null);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recId = urlParams.get('id');
    
    if (recId) {
      const data = await TradingRecommendation.list();
      const rec = data.find(r => r.id === recId);
      setRecommendation(rec);
      
      // Check if user has tracked result for this recommendation
      const results = await TradeResult.list();
      const result = results.find(r => r.analysis_id === recId);
      setTradeResult(result);
    }
    setIsLoading(false);
  };

  const actionColors = {
    STRONG_BUY: "bg-green-500/20 text-green-400 border-green-500/30",
    BUY: "bg-green-600/20 text-green-300 border-green-600/30",
    HOLD: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    SELL: "bg-red-600/20 text-red-300 border-red-600/30",
    STRONG_SELL: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  const typeIcons = {
    stock: Building2,
    crypto: TrendingUp,
    forex: Zap
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/3" />
            <div className="h-64 bg-slate-700 rounded" />
            <div className="h-32 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-white mb-4">Recommendation Not Found</h2>
              <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const TypeIcon = typeIcons[recommendation.recommendation_type];
  const actionColor = actionColors[recommendation.recommendation_action] || actionColors.HOLD;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
            className="border-slate-700 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${
              recommendation.recommendation_type === 'stock' ? 'bg-gradient-to-r from-red-500 to-orange-600' :
              recommendation.recommendation_type === 'crypto' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}>
              <TypeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white">{recommendation.asset_symbol}</h1>
              <p className="text-slate-400 text-sm">{recommendation.asset_name}</p>
            </div>
          </div>
        </motion.div>

        {/* Recommendation Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-4 md:p-6">
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className={`p-4 rounded-xl ${actionColor} mb-2`}>
                    <div className="text-2xl md:text-3xl font-bold">
                      {recommendation.recommendation_action}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">AI Recommendation</p>
                </div>
                
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">
                    +{recommendation.expected_return_percent?.toFixed(1) || 0}%
                  </div>
                  <p className="text-emerald-400 text-sm">Expected Return</p>
                  <p className="text-slate-500 text-xs mt-1">{recommendation.time_horizon}</p>
                </div>
                
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-blue-400 mb-1">
                    {recommendation.confidence_score || 90}%
                  </div>
                  <p className="text-slate-400 text-sm">AI Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Price Targets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Current Price</div>
              <div className="text-lg md:text-xl font-bold text-white">
                {recommendation.recommendation_type === 'stock' ? 'Rp ' : '$'}
                {recommendation.current_price?.toLocaleString() || '-'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-slate-400 text-sm mb-1">Target Price</div>
              <div className="text-lg md:text-xl font-bold text-green-400">
                {recommendation.recommendation_type === 'stock' ? 'Rp ' : '$'}
                {recommendation.target_price?.toLocaleString() || '-'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <div className="text-slate-400 text-sm mb-1">Stop Loss</div>
              <div className="text-lg md:text-xl font-bold text-red-400">
                {recommendation.recommendation_type === 'stock' ? 'Rp ' : '$'}
                {recommendation.stop_loss?.toLocaleString() || '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Reasoning */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                📈 Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm leading-relaxed">
                {recommendation.technical_reason || 'Technical analysis not available'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                Fundamental News
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                {recommendation.fundamental_reason || 'Fundamental analysis not available'}
              </p>
              {recommendation.news_catalyst && recommendation.news_catalyst.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-400">Key News:</h5>
                  {recommendation.news_catalyst.slice(0, 2).map((news, i) => (
                    <div key={i} className="p-2 rounded bg-slate-800/50 text-xs text-slate-300">
                      • {news}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* DCA Calculator for Indonesian Stocks */}
        {recommendation.recommendation_type === 'stock' && recommendation.dca_recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Investment Calculator - Cicilan Saham
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                    <div className="text-slate-400 text-sm">Cicilan Bulanan</div>
                    <div className="text-lg font-bold text-emerald-400">
                      Rp {recommendation.dca_recommendation.monthly_amount?.toLocaleString('id-ID') || '1,000,000'}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-500/10">
                    <div className="text-slate-400 text-sm">Durasi</div>
                    <div className="text-lg font-bold text-blue-400">
                      {recommendation.dca_recommendation.duration_months || 12} Bulan
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/10">
                    <div className="text-slate-400 text-sm">Total Investasi</div>
                    <div className="text-lg font-bold text-purple-400">
                      Rp {recommendation.dca_recommendation.total_investment?.toLocaleString('id-ID') || '12,000,000'}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowCalculator(!showCalculator)}
                  variant="outline"
                  className="w-full border-slate-600 hover:bg-slate-800"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {showCalculator ? 'Tutup' : 'Buka'} Kalkulator DCA
                </Button>
                
                {showCalculator && (
                  <div className="mt-4">
                    <DCACalculator recommendation={recommendation} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trade Result Tracker */}
        <TradeResultTracker 
          recommendation={recommendation}
          existingResult={tradeResult}
          onResultSaved={() => loadRecommendation()}
        />
      </div>
    </div>
  );
}