import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Shield, Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const riskColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function AnalysisCard({ analysis, tradeResult, onClick }) {
  const isStock = analysis.analysis_type === 'stock';
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="glass-effect border-slate-700 cursor-pointer hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden"
        onClick={onClick}
      >
        {/* Trade Result Indicator */}
        {tradeResult && (
          <div className="absolute top-2 left-2 z-10">
            {tradeResult.result_status === 'SUCCESS' ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            ) : tradeResult.result_status === 'FAILED' ? (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <XCircle className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        )}

        <CardContent className="p-3 md:p-4">
          <div className="relative mb-3">
            <img
              src={analysis.image_url}
              alt="Chart analysis"
              className="w-full h-24 md:h-32 object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className={riskColors[analysis.risk_level || analysis.investment_recommendation?.risk_level] || riskColors.medium}>
                {analysis.risk_level || analysis.investment_recommendation?.risk_level || 'medium'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-sm md:text-base truncate">
                {isStock ? analysis.stock_code : (analysis.crypto_pair || 'Crypto Analysis')}
              </h4>
              <div className="flex items-center gap-1">
                {isStock ? (
                  <Building2 className="w-3 h-3 text-red-400" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                )}
                <Badge variant="outline" className="text-xs border-slate-600">
                  {isStock ? 'SAHAM' : analysis.trading_type?.toUpperCase()}
                </Badge>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-400 truncate">
              {isStock ? analysis.stock_name : (analysis.pattern_detected || 'Pattern detected')}
            </p>

            {/* Trade Result Summary */}
            {tradeResult && (
              <div className="p-2 rounded bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Result:</span>
                  <span className={`font-bold ${
                    tradeResult.profit_loss_percent > 0 ? 'text-green-400' : 
                    tradeResult.profit_loss_percent < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {tradeResult.profit_loss_percent > 0 ? '+' : ''}{tradeResult.profit_loss_percent?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-400">Period:</span>
                  <span className="text-slate-300">{tradeResult.holding_period_days || 0} hari</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs">
              <div className="text-center p-1 md:p-2 rounded bg-blue-500/10">
                <TrendingUp className="w-3 h-3 mx-auto mb-1 text-blue-400" />
                <div className="text-blue-400 font-semibold text-xs truncate">
                  {isStock ? 'Rp ' : '$'}{(analysis.current_price || analysis.entry_price || 0).toFixed(isStock ? 0 : 2)}
                </div>
              </div>
              <div className="text-center p-1 md:p-2 rounded bg-green-500/10">
                <Target className="w-3 h-3 mx-auto mb-1 text-green-400" />
                <div className="text-green-400 font-semibold text-xs truncate">
                  {isStock ? 'Rp ' : '$'}{(analysis.investment_recommendation?.target_price || analysis.take_profit_1 || 0).toFixed(isStock ? 0 : 2)}
                </div>
              </div>
              <div className="text-center p-1 md:p-2 rounded bg-red-500/10">
                <Shield className="w-3 h-3 mx-auto mb-1 text-red-400" />
                <div className="text-red-400 font-semibold text-xs truncate">
                  {isStock ? 'Rp ' : '$'}{(analysis.investment_recommendation?.stop_loss || analysis.stop_loss || 0).toFixed(isStock ? 0 : 2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-xs text-slate-500">
                {format(new Date(analysis.created_date), 'dd MMM yyyy')}
              </span>
              <span className="text-xs text-green-400 font-medium">
                {analysis.confidence_score || 90}% confidence
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}