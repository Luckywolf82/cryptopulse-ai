import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, DollarSign, BarChart2, X } from "lucide-react";
import { format } from "date-fns";

export default function SignalDetailModal({ signal, onClose, onCreatePaperTrade }) {
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
                {signal.direction.toUpperCase()} Signal • {signal.timeframe}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Score & Trigger */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-2">Signal Score</div>
              <div className={`text-4xl font-bold ${getScoreColor(signal.score)}`}>
                {signal.score}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {signal.score >= 70 ? 'High Quality' : signal.score >= 50 ? 'Medium Quality' : 'Low Quality'}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-2">Trigger Type</div>
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
                <span className="text-sm">Entry Price</span>
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
                Signal Indicators
              </div>
              <div className="grid grid-cols-2 gap-3">
                {meta.volumeSpike !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Volume Spike</span>
                    <Badge className={meta.volumeSpike ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {meta.volumeSpike ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                )}
                {meta.htfAlign !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">HTF Alignment</span>
                    <Badge className={meta.htfAlign ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {meta.htfAlign ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                )}
                {meta.volatilityHealthy !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Volatility</span>
                    <Badge className={meta.volatilityHealthy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {meta.volatilityHealthy ? 'Healthy' : 'High'}
                    </Badge>
                  </div>
                )}
                {meta.lowLiquidity !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Liquidity</span>
                    <Badge className={meta.lowLiquidity ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                      {meta.lowLiquidity ? 'Low' : 'Good'}
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
              <span className="text-sm">Signal Received</span>
            </div>
            <div className="text-white">
              {format(new Date(signal.created_date), 'PPpp')}
            </div>
          </div>

          {/* Raw Payload */}
          {Object.keys(payload).length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-3">Raw Payload</div>
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
              Create Paper Trade
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