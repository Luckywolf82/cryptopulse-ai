
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Shield, Brain, AlertTriangle, ArrowUp, ArrowDown, Eye, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const riskColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30"
};

const strategyColors = {
  scalping: "bg-red-500/20 text-red-400 border-red-500/30",
  swing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  position: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  spot: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  forex: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const marketColors = {
  bullish: "text-green-400",
  bearish: "text-red-400",
  sideways: "text-yellow-400"
};

const ExpertConfidenceMeter = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };
  
  const getScoreLabel = () => {
    if (score >= 90) return "EXPERT";
    if (score >= 80) return "TINGGI";
    if (score >= 70) return "SEDANG";
    return "HATI-HATI";
  };

  return (
    <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">Expert Confidence</div>
        <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                    className="text-gray-700"
                    stroke="currentColor"
                    strokeDasharray="100, 100"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                />
                <path
                    className={getScoreColor()}
                    stroke="currentColor"
                    strokeDasharray={`${score}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{score}%</span>
            </div>
        </div>
        <div className={`mt-2 font-bold text-sm ${getScoreColor()}`}>
            {getScoreLabel()}
        </div>
    </div>
  );
};

export default function AnalysisResult({ analysis, uploadedImage, onNewAnalysis }) {
  const actionColor = analysis.trading_direction === 'BUY' ? 'text-green-400' : 'text-red-400';
  const actionBg = analysis.trading_direction === 'BUY' ? 'bg-green-500/10' : 'bg-red-500/10';
  const actionBorder = analysis.trading_direction === 'BUY' ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Clear Trading Action */}
      <Card className="glass-effect border-gray-700">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <img
                src={analysis.image_url}
                alt="Analyzed chart"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Expert Analysis</h2>
                  <p className="text-gray-400">
                    {format(new Date(analysis.created_date), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>

              {/* CLEAR TRADING ACTION */}
              <div className={`p-4 rounded-lg ${actionBg} border ${actionBorder}`}>
                <div className="flex items-center justify-center gap-3 mb-2">
                  {analysis.trading_direction === 'BUY' ? 
                    <ArrowUp className="w-8 h-8 text-green-400" /> : 
                    <ArrowDown className="w-8 h-8 text-red-400" />
                  }
                  <div>
                    <div className={`text-2xl font-bold ${actionColor}`}>
                      {analysis.trading_direction}
                    </div>
                    <div className="text-sm text-gray-300">
                      {analysis.entry_action || 'MARKET ORDER'}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {analysis.crypto_pair || 'CRYPTO/USDT'}
                  </div>
                  <div className="text-sm text-gray-400">
                    @ ${analysis.entry_price?.toFixed(4) || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Type:</span>
                  <Badge variant="outline" className={strategyColors[analysis.trading_type] || "border-blue-500/30 text-blue-400"}>
                    {analysis.trading_type.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Strategy:</span>
                  <Badge variant="outline" className={strategyColors[analysis.strategy_type]}>
                    {analysis.strategy_type?.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">TimeFrame:</span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    {analysis.timeframe?.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">R:R:</span>
                  <span className="text-green-400 font-bold">
                    {analysis.risk_reward_ratio || '1:3'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <ExpertConfidenceMeter score={analysis.confidence_score || 85} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Analysis with Visual Reference */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-effect border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Pattern Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-bold text-blue-300 mb-2 text-lg">
                  {analysis.pattern_detected || 'Advanced Pattern'}
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  {analysis.pattern_description || 'Pattern candlestick dengan konfirmasi kuat'}
                </p>
                <div className="flex items-center gap-2">
                  {analysis.volume_confirmation && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Volume ✓
                    </Badge>
                  )}
                  <Badge variant="outline" className={riskColors[analysis.risk_level]}>
                    {analysis.risk_level?.toUpperCase()} Risk
                  </Badge>
                </div>
              </div>

              {/* Pattern Reference Image */}
              {analysis.pattern_image_url && (
                <div className="border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 border-b border-gray-600">
                    Pattern Reference
                  </div>
                  <img
                    src={analysis.pattern_image_url}
                    alt="Pattern reference"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Technical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg bg-${analysis.market_condition === 'bullish' ? 'green' : analysis.market_condition === 'bearish' ? 'red' : 'yellow'}-500/10 border border-${analysis.market_condition === 'bullish' ? 'green' : analysis.market_condition === 'bearish' ? 'red' : 'yellow'}-500/20`}>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Market Condition:</span>
                  <span className={`font-bold ${marketColors[analysis.market_condition]}`}>
                    {analysis.market_condition?.toUpperCase()}
                  </span>
                </div>
              </div>

              {analysis.technical_indicators && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">
                    Technical Indicators
                  </div>
                  {Object.entries(analysis.technical_indicators).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-gray-200 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {analysis.key_levels && analysis.key_levels.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">
                    Key Levels
                  </div>
                  {analysis.key_levels.slice(0, 3).map((level, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/30">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          level.type === 'support' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className="text-sm text-gray-300 capitalize">{level.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-white">${level.level}</span>
                        <div className="text-xs text-gray-400">{level.strength}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expert Trading Plan */}
      <Card className="glass-effect border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            🎯 Expert Trading Plan
            <Badge variant="outline" className={
              analysis.trading_direction === 'BUY' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
            }>
              {analysis.trading_direction} SETUP
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Entry */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className={`p-4 rounded-lg ${actionBg} border ${actionBorder} text-center`}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  {analysis.trading_direction === 'BUY' ? 
                    <ArrowUp className="w-5 h-5 text-white" /> : 
                    <ArrowDown className="w-5 h-5 text-white" />
                  }
                </div>
                <h4 className="font-semibold text-white mb-1">ENTRY</h4>
                <p className="text-xl font-bold text-blue-400">
                  ${analysis.entry_price?.toFixed(4) || '-'}
                </p>
                <p className="text-xs text-gray-400">
                  {analysis.entry_action}
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
                  ${analysis.stop_loss?.toFixed(4) || '-'}
                </p>
                <p className="text-xs text-gray-400">Protect Capital</p>
              </div>
            </motion.div>

            {/* TP1 */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">TP1</h4>
                <p className="text-xl font-bold text-green-400">
                  ${analysis.take_profit_1?.toFixed(4) || '-'}
                </p>
                <p className="text-xs text-gray-400">
                  {analysis.estimated_time_tp1 || '15-30 min'}
                </p>
              </div>
            </motion.div>

            {/* TP2 */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="p-4 rounded-lg bg-green-600/10 border border-green-600/20 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">TP2</h4>
                <p className="text-xl font-bold text-green-500">
                  ${analysis.take_profit_2?.toFixed(4) || '-'}
                </p>
                <p className="text-xs text-gray-400">
                  {analysis.estimated_time_tp2 || '1-2 hours'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* TP3 if exists */}
          {analysis.take_profit_3 && (
            <div className="flex justify-center mb-6">
              <motion.div whileHover={{ scale: 1.02 }} className="w-full max-w-xs">
                <div className="p-4 rounded-lg bg-green-700/10 border border-green-700/20 text-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">TP3 (BONUS)</h4>
                  <p className="text-xl font-bold text-green-600">
                    ${analysis.take_profit_3?.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {analysis.estimated_time_tp3 || '4+ hours'}
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Expert Reasoning */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">Expert Analysis Reasoning</h4>
                <p className="text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                  {analysis.expert_reasoning || analysis.analysis_notes || 
                    `Setup ${analysis.trading_direction} pada pattern ${analysis.pattern_detected} dengan konfirmasi teknikal yang kuat. Risk-reward ratio ${analysis.risk_reward_ratio} memberikan peluang profit yang menguntungkan.`
                  }
                </p>
                <div className="text-xs text-gray-400">
                  <strong>Catatan:</strong> Selalu gunakan position size yang sesuai dengan risk tolerance Anda. 
                  Recommended: 1-2% dari total modal per trade.
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Potential Risks & Invalidation Card */}
          {analysis.potential_risks && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-300 mb-2">Potensi Risiko & Invalidasi</h4>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.potential_risks}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Risk Warning */}
      <Card className="glass-effect border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-6 flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-orange-400 mt-1" />
          <div>
            <h4 className="font-bold text-orange-400 mb-2">⚠️ PROFESSIONAL TRADING DISCLAIMER</h4>
            <p className="text-sm text-gray-300 mb-3">
              Analisis ini disediakan untuk tujuan edukasi dan informasi. Meskipun menggunakan metodologi trading profesional, 
              pasar crypto sangat volatile dan tidak dapat diprediksi 100%.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
              <div>
                <strong className="text-orange-300">Risk Management:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Maksimal 1-2% modal per trade</li>
                  <li>• Selalu set Stop Loss sebelum entry</li>
                  <li>• Take profit secara bertahap</li>
                </ul>
              </div>
              <div>
                <strong className="text-orange-300">Trading Rules:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• DYOR sebelum trading</li>
                  <li>• Ikuti money management</li>
                  <li>• Jangan FOMO atau revenge trading</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={onNewAnalysis}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold px-8 py-3"
        >
          <Plus className="w-5 h-5 mr-2" />
          Analisis Chart Baru
        </Button>
      </div>
    </motion.div>
  );
}
