import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const riskColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function RecentAnalyses({ analyses, isLoading, onRefresh, onCardClick }) {
  return (
    <Card className="glass-effect border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-white">
          Analisis Terbaru
        </CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="border-gray-600 hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''} text-white`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : analyses.length > 0 ? (
          <div className="space-y-4">
            {analyses.slice(0, 5).map((analysis, index) => {
              const isStock = analysis.analysis_type === 'stock';
              return (
              <motion.div
                key={analysis.id}
                onClick={() => onCardClick(analysis)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={analysis.image_url}
                    alt="Chart"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="outline" className={riskColors[analysis.risk_level || analysis.investment_recommendation?.risk_level] || riskColors.medium}>
                      {analysis.risk_level || analysis.investment_recommendation?.risk_level}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">
                      {isStock ? analysis.stock_code : (analysis.crypto_pair || 'Crypto Analysis')}
                    </h4>
                    <Badge variant="outline" className="text-xs border-gray-600">
                      {isStock ? 'SAHAM' : analysis.trading_type?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-2 truncate">
                    {isStock ? analysis.stock_name : (analysis.pattern_detected || 'Pattern detected')}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{format(new Date(analysis.created_date), 'dd MMM yyyy')}</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      {analysis.confidence_score}% akurasi
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-green-400 mb-1">
                    Entry: {isStock ? 'Rp ' : '$'}{(analysis.entry_price || analysis.current_price)?.toFixed(isStock ? 0 : 2) || '-'}
                  </div>
                  <div className="text-xs text-gray-400">
                    TP1: {isStock ? 'Rp ' : '$'}{(analysis.take_profit_1 || analysis.investment_recommendation?.target_price)?.toFixed(isStock ? 0 : 2) || '-'}
                  </div>
                  <div className="text-xs text-gray-400">
                    SL: {isStock ? 'Rp ' : '$'}{(analysis.stop_loss || analysis.investment_recommendation?.stop_loss)?.toFixed(isStock ? 0 : 2) || '-'}
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-gray-500" />
              </motion.div>
            )})}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Belum ada analisis</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload chart pertama Anda untuk memulai
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}