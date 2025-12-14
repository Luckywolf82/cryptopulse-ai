import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Building2, Newspaper, Target, Shield, Clock, ArrowUp, ArrowDown, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const actionColors = {
  STRONG_BUY: "text-green-400 bg-green-500/10 border-green-500/20",
  BUY: "text-green-300 bg-green-600/10 border-green-600/20", 
  HOLD: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  SELL: "text-red-300 bg-red-600/10 border-red-600/20",
  STRONG_SELL: "text-red-400 bg-red-500/10 border-red-500/20"
};

const riskColors = {
  low: "text-green-400",
  medium: "text-yellow-400", 
  high: "text-red-400"
};

const sentimentColors = {
  positive: "text-green-400",
  negative: "text-red-400",
  neutral: "text-gray-400"
};

export default function StockAnalysisResult({ analysis, uploadedImage, onNewAnalysis }) {
  const actionColor = actionColors[analysis.investment_recommendation?.action] || actionColors.HOLD;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Stock Info */}
      <Card className="glass-effect border-slate-700">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <img
                src={analysis.image_url}
                alt="Stock chart"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{analysis.stock_code || 'STOCK'}</h2>
                  <p className="text-slate-400">
                    {analysis.stock_name || 'Indonesian Stock'} • {analysis.sector || 'Various Sector'}
                  </p>
                </div>
              </div>

              {/* Current Price Info */}
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Current Price</span>
                  <div className="flex items-center gap-2">
                    {analysis.price_change_percent > 0 ? 
                      <ArrowUp className="w-4 h-4 text-green-400" /> : 
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    }
                    <span className={analysis.price_change_percent > 0 ? 'text-green-400' : 'text-red-400'}>
                      {analysis.price_change_percent?.toFixed(2) || 0}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  Rp {analysis.current_price?.toLocaleString('id-ID') || '0'}
                </div>
                <div className={`text-sm ${analysis.price_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analysis.price_change > 0 ? '+' : ''}Rp {analysis.price_change?.toLocaleString('id-ID') || '0'}
                </div>
              </div>

              {/* Investment Recommendation */}
              <div className={`p-4 rounded-lg ${actionColor}`}>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {analysis.investment_recommendation?.action || 'HOLD'}
                  </div>
                  <div className="text-sm opacity-80">
                    Investment Recommendation
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">AI Confidence</div>
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-700"
                      stroke="currentColor"
                      strokeDasharray="100, 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="3"
                    />
                    <path
                      className="text-orange-400"
                      stroke="currentColor"
                      strokeDasharray={`${analysis.confidence_score || 90}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{analysis.confidence_score || 90}%</span>
                  </div>
                </div>
                <div className="mt-2 font-bold text-sm text-orange-400">
                  HIGH CONFIDENCE
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Technical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Trend Direction</span>
                <Badge className={
                  analysis.technical_analysis?.trend_direction === 'bullish' ? 'bg-green-500/20 text-green-400' :
                  analysis.technical_analysis?.trend_direction === 'bearish' ? 'bg-red-500/20 text-red-400' : 
                  'bg-yellow-500/20 text-yellow-400'
                }>
                  {analysis.technical_analysis?.trend_direction?.toUpperCase() || 'SIDEWAYS'}
                </Badge>
              </div>
              <p className="text-white font-semibold">
                {analysis.technical_analysis?.pattern_detected || 'No clear pattern'}
              </p>
            </div>

            {/* Support/Resistance Levels */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300">Key Levels</h4>
              {analysis.technical_analysis?.resistance_levels?.slice(0, 2).map((level, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-red-500/10">
                  <span className="text-red-300 text-sm">Resistance {i + 1}</span>
                  <span className="text-white font-semibold">Rp {level?.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {analysis.technical_analysis?.support_levels?.slice(0, 2).map((level, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-green-300 text-sm">Support {i + 1}</span>
                  <span className="text-white font-semibold">Rp {level?.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Fundamental Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.fundamental_analysis && Object.entries(analysis.fundamental_analysis).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                <span className="text-slate-300 text-sm capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-white font-semibold">
                  {typeof value === 'number' ? value.toFixed(2) : value || 'N/A'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Investment Plan */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            🎯 Investment Plan
            <Badge className={actionColor}>
              {analysis.investment_recommendation?.action || 'HOLD'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Target Price */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">TARGET PRICE</h4>
                <p className="text-xl font-bold text-green-400">
                  Rp {analysis.investment_recommendation?.target_price?.toLocaleString('id-ID') || '-'}
                </p>
                <p className="text-xs text-slate-400">
                  {analysis.investment_recommendation?.time_horizon || 'Medium term'}
                </p>
              </div>
            </motion.div>

            {/* Stop Loss */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">STOP LOSS</h4>
                <p className="text-xl font-bold text-red-400">
                  Rp {analysis.investment_recommendation?.stop_loss?.toLocaleString('id-ID') || '-'}
                </p>
                <p className="text-xs text-slate-400">Risk Protection</p>
              </div>
            </motion.div>

            {/* Entry Timing */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">ENTRY TIMING</h4>
                <p className="text-sm font-bold text-blue-400 px-2">
                  {analysis.investment_recommendation?.entry_timing || 'Wait for confirmation'}
                </p>
              </div>
            </motion.div>

            {/* Risk Level */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">RISK LEVEL</h4>
                <p className={`text-xl font-bold ${riskColors[analysis.investment_recommendation?.risk_level] || 'text-yellow-400'}`}>
                  {analysis.investment_recommendation?.risk_level?.toUpperCase() || 'MEDIUM'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Analysis Summary */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">Investment Analysis Summary</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {analysis.analysis_summary || 'Analysis summary not available'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Analysis */}
      {analysis.news_analysis && analysis.news_analysis.length > 0 && (
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              Latest News Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.news_analysis.slice(0, 3).map((news, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-white text-sm leading-relaxed flex-1">
                      {news.headline || 'News headline'}
                    </h5>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={sentimentColors[news.sentiment] ? `border-${news.sentiment === 'positive' ? 'green' : news.sentiment === 'negative' ? 'red' : 'gray'}-500/30 ${sentimentColors[news.sentiment]}` : 'border-gray-500/30 text-gray-400'}>
                        {news.sentiment?.toUpperCase() || 'NEUTRAL'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Impact: {news.impact_score || 5}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">
                    {news.summary || 'News summary not available'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{news.source || 'Unknown source'}</span>
                    <span>{news.date || format(new Date(), 'dd MMM yyyy')}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Catalysts & Risk Factors */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              📈 Key Catalysts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.key_catalysts?.map((catalyst, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded bg-green-500/5">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{catalyst}</span>
                </div>
              ))}
              {(!analysis.key_catalysts || analysis.key_catalysts.length === 0) && (
                <p className="text-slate-400 text-sm">No key catalysts identified</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              ⚠️ Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.risk_factors?.map((risk, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded bg-red-500/5">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{risk}</span>
                </div>
              ))}
              {(!analysis.risk_factors || analysis.risk_factors.length === 0) && (
                <p className="text-slate-400 text-sm">No major risk factors identified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={onNewAnalysis}
          className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold px-8 py-3"
        >
          <Plus className="w-5 h-5 mr-2" />
          Analisis Saham Lain
        </Button>
      </div>
    </motion.div>
  );
}