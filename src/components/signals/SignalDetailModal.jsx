import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, DollarSign, BarChart2, X, Sparkles, Loader2, Target, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SignalDetailModal({ signal, onClose, onCreatePaperTrade }) {
  const { t } = useTranslation();
  const [recommendation, setRecommendation] = useState(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  
  useEffect(() => {
    if (signal) {
      loadRecommendation();
    }
  }, [signal?.id]);
  
  const loadRecommendation = async () => {
    if (!signal) return;
    
    setIsLoadingRecommendation(true);
    try {
      const recommendations = await base44.entities.TradingRecommendation.filter({ signalId: signal.id });
      if (recommendations.length > 0) {
        setRecommendation(recommendations[0]);
      }
    } catch (error) {
      console.error("Failed to load recommendation:", error);
    }
    setIsLoadingRecommendation(false);
  };
  
  const generateRecommendation = async () => {
    setIsGeneratingRecommendation(true);
    try {
      await base44.functions.invoke('generateRecommendationOnSignal', {
        event: { type: 'create', entity_name: 'Signal', entity_id: signal.id },
        data: signal
      });
      
      toast.success("AI recommendation generated!");
      await loadRecommendation();
    } catch (error) {
      console.error("Failed to generate recommendation:", error);
      toast.error("Failed to generate recommendation");
    }
    setIsGeneratingRecommendation(false);
  };
  
  if (!signal) return null;

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const payload = signal.payload || {};
  const meta = payload.meta || {};

  return (
    <Dialog open={!!signal} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className={`p-2 rounded-lg ${
              signal.direction === 'long' 
                ? 'bg-green-500/20' 
                : 'bg-red-500/20'
            }`}>
              {signal.direction === 'long' ? (
                <ArrowUpRight className="w-6 h-6 text-green-400" />
              ) : (
                <ArrowDownRight className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>{signal.symbol}</span>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  {signal.exchange}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 font-normal">
                {t(`signals.${signal.direction}`)} Signal • {signal.timeframe}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Score & Trigger */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-2">{t('signals.signalScore')}</div>
              <div className={`text-4xl font-bold ${getScoreColor(signal.score)}`}>
                {signal.score}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {signal.score >= 70 ? t('signals.highQuality') : signal.score >= 50 ? 'Medium Quality' : 'Low Quality'}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-2">{t('signals.triggerType')}</div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-lg px-3 py-1">
                {signal.triggerType}
              </Badge>
              <div className="text-xs text-slate-500 mt-2">
                {signal.triggerType === 'EMA_FLIP' && 'EMA Crossover'}
                {signal.triggerType === 'MSS' && 'Market Structure Shift'}
                {signal.triggerType === 'RSI_DIV' && 'RSI Divergence'}
              </div>
            </div>
          </div>

          {/* Price Info */}
          {signal.price && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">{t('signals.entryPrice')}</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${signal.price.toLocaleString()}
              </div>
            </div>
          )}

          {/* Metadata */}
          {Object.keys(meta).length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('signals.signalIndicators')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {meta.volumeSpike !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{t('signals.volumeSpike')}</span>
                    <Badge className={meta.volumeSpike ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {meta.volumeSpike ? t('signals.yes') : t('signals.no')}
                    </Badge>
                  </div>
                )}
                {meta.htfAlign !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{t('signals.htfAlignment')}</span>
                    <Badge className={meta.htfAlign ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {meta.htfAlign ? t('signals.yes') : t('signals.no')}
                    </Badge>
                  </div>
                )}
                {meta.volatilityHealthy !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{t('signals.volatility')}</span>
                    <Badge className={meta.volatilityHealthy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {meta.volatilityHealthy ? t('signals.healthy') : t('signals.high')}
                    </Badge>
                  </div>
                )}
                {meta.lowLiquidity !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{t('signals.liquidity')}</span>
                    <Badge className={meta.lowLiquidity ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                      {meta.lowLiquidity ? t('signals.low') : t('signals.good')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{t('signals.signalReceived')}</span>
            </div>
            <div className="text-white">
              {format(new Date(signal.created_date), 'PPpp')}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Smart AI Recommendation</h3>
              </div>
              {!recommendation && !isLoadingRecommendation && (
                <Button
                  onClick={generateRecommendation}
                  disabled={isGeneratingRecommendation}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGeneratingRecommendation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {isLoadingRecommendation ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : recommendation ? (
              <div className="space-y-4">
                {/* Action Badge */}
                <div className="flex items-center gap-3">
                  <Badge className={`text-sm px-3 py-1 ${
                    recommendation.recommendation_action === 'STRONG_BUY' || recommendation.recommendation_action === 'BUY'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : recommendation.recommendation_action === 'SELL' || recommendation.recommendation_action === 'STRONG_SELL'
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                  }`}>
                    {recommendation.recommendation_action}
                  </Badge>
                  {recommendation.confidence_score && (
                    <span className="text-sm text-slate-400">
                      Confidence: <span className="text-purple-400 font-semibold">{recommendation.confidence_score}%</span>
                    </span>
                  )}
                </div>

                {/* Price Targets */}
                {(recommendation.current_price || recommendation.target_price || recommendation.stop_loss) && (
                  <div className="grid grid-cols-3 gap-3">
                    {recommendation.current_price && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-slate-400 mb-1">Current</div>
                        <div className="text-white font-semibold">${recommendation.current_price}</div>
                      </div>
                    )}
                    {recommendation.target_price && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Target
                        </div>
                        <div className="text-green-400 font-semibold">${recommendation.target_price}</div>
                      </div>
                    )}
                    {recommendation.stop_loss && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Stop Loss
                        </div>
                        <div className="text-red-400 font-semibold">${recommendation.stop_loss}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Reason */}
                {recommendation.technical_reason && (
                  <div className="bg-slate-800/30 rounded p-3">
                    <div className="text-xs text-purple-400 mb-2 font-semibold">Technical Analysis</div>
                    <p className="text-sm text-slate-300">{recommendation.technical_reason}</p>
                  </div>
                )}

                {/* Fundamental Reason */}
                {recommendation.fundamental_reason && (
                  <div className="bg-slate-800/30 rounded p-3">
                    <div className="text-xs text-blue-400 mb-2 font-semibold">Fundamental Analysis</div>
                    <p className="text-sm text-slate-300">{recommendation.fundamental_reason}</p>
                  </div>
                )}

                {/* Risk Factors */}
                {recommendation.risk_factors && recommendation.risk_factors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                    <div className="text-xs text-red-400 mb-2 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Risk Factors
                    </div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {recommendation.risk_factors.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expected Return */}
                {recommendation.expected_return_percent && (
                  <div className="text-center py-2 bg-emerald-900/20 rounded">
                    <div className="text-xs text-slate-400">Expected Return</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      +{recommendation.expected_return_percent}%
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No AI recommendation yet.</p>
                <p className="text-xs mt-2">Click "Generate" to create one.</p>
              </div>
            )}
          </div>

          {/* Raw Payload */}
          {Object.keys(payload).length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-3">{t('signals.rawPayload')}</div>
              <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-900/50 p-3 rounded">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                onCreatePaperTrade(signal);
                onClose();
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              {t('signals.simulateTrade')}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}