import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Shield, Brain, Calendar, Building2, BarChart, Newspaper, Percent } from "lucide-react";
import { format } from "date-fns";
import { TradeResult } from "@/entities/TradeResult";
import TradeResultTracker from "../investment/TradeResultTracker";
import DCACalculator from "../investment/DCACalculator";

const riskColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function AnalysisModal({ analysis, onClose, onResultUpdate }) {
  const [tradeResult, setTradeResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (analysis) {
        const results = await TradeResult.filter({ analysis_id: analysis.id });
        if (results.length > 0) {
          setTradeResult(results[0]);
        } else {
          setTradeResult(null);
        }
      }
    };
    fetchResult();
  }, [analysis]);

  if (!analysis) return null;

  const isStock = analysis.analysis_type === 'stock';
  const confidenceColor = analysis.confidence_score >= 90 ? "text-green-400" :
                         analysis.confidence_score >= 80 ? "text-blue-400" : "text-yellow-400";
  
  const recommendation = analysis.investment_recommendation;
  const technicals = analysis.technical_analysis;

  const handleUpdate = () => {
    if (onResultUpdate) {
      onResultUpdate();
    }
  };

  return (
    <Dialog open={!!analysis} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            {isStock ? <Building2 className="w-6 h-6 text-red-400" /> : <TrendingUp className="w-6 h-6 text-blue-400" />}
            Detail Analisis: {isStock ? analysis.stock_code : analysis.crypto_pair}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isStock ? analysis.stock_name : `Analisis ${analysis.trading_type} trading`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="glass-effect border-slate-700">
                  <CardContent className="p-2">
                    <img
                      src={analysis.image_url}
                      alt="Chart analysis"
                      className="w-full h-auto rounded-lg shadow-lg mx-auto"
                    />
                  </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="glass-effect border-slate-700">
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">Tanggal</div>
                    <div className="text-white font-semibold">
                      {format(new Date(analysis.created_date), 'dd MMM yyyy')}
                    </div>
                  </div>
                   <div className="text-center">
                    <BarChart className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">Timeframe</div>
                    <div className="text-white font-semibold">
                      {analysis.timeframe || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Shield className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">Risk Level</div>
                    <Badge variant="outline" className={`${riskColors[isStock ? recommendation?.risk_level : analysis.risk_level]} mt-1`}>
                      {(isStock ? recommendation?.risk_level : analysis.risk_level)?.toUpperCase() || 'MEDIUM'}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Percent className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">AI Confidence</div>
                    <div className={`font-bold ${confidenceColor}`}>
                      {analysis.confidence_score}%
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-slate-700">
                <CardContent className="p-4">
                   <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                     <Brain className="w-5 h-5 text-blue-400" />
                     {isStock ? 'Rekomendasi Aksi' : 'Trading Direction'}
                   </h4>
                   <Badge className={riskColors[recommendation?.action === 'BUY' ? 'low' : 'high']}>
                      {isStock ? recommendation?.action : analysis.trading_direction}
                   </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="glass-effect border-slate-700">
             <CardContent className="p-4">
               <h3 className="text-lg font-bold text-white mb-4">Trading Plan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                      <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-xs text-slate-400 mb-1">Entry Price</div>
                      <div className="text-lg font-bold text-blue-400">
                        {isStock ? 'Rp ' : '$'}{(isStock ? analysis.current_price : analysis.entry_price)?.toFixed(isStock ? 0 : 2) || '-'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 text-center">
                      <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <div className="text-xs text-slate-400 mb-1">Take Profit</div>
                      <div className="text-lg font-bold text-green-400">
                        {isStock ? 'Rp ' : '$'}{(isStock ? recommendation?.target_price : analysis.take_profit_1)?.toFixed(isStock ? 0 : 2) || '-'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 text-center">
                      <Shield className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
                      <div className="text-lg font-bold text-red-400">
                        {isStock ? 'Rp ' : '$'}{(isStock ? recommendation?.stop_loss : analysis.stop_loss)?.toFixed(isStock ? 0 : 2) || '-'}
                      </div>
                    </div>
                     <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                      <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-xs text-slate-400 mb-1">Time Horizon</div>
                      <div className="text-lg font-bold text-purple-400">
                        {isStock ? recommendation?.time_horizon : analysis.strategy_type}
                      </div>
                    </div>
                </div>
             </CardContent>
          </Card>
          
          {/* Trade Result Tracker */}
          <TradeResultTracker 
            analysis={analysis} 
            tradeResult={tradeResult} 
            onUpdate={handleUpdate}
          />
          
          {isStock && (
            <>
            <Card className="glass-effect border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Newspaper/> Berita & Katalis</h3>
                {analysis.news_analysis?.map((news, index) => (
                  <div key={index} className="mb-2 p-2 bg-slate-800/50 rounded">
                    <p className="font-semibold text-blue-300">{news.headline}</p>
                    <p className="text-sm text-slate-300">{news.summary}</p>
                    <p className="text-xs text-slate-500">{news.source} - {news.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <DCACalculator stockPrice={analysis.current_price} stockCode={analysis.stock_code} />
            </>
          )}

          <Card className="glass-effect border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-semibold text-white mb-3">Catatan Analisis AI</h4>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 whitespace-pre-wrap">
                <p className="text-slate-300 leading-relaxed">
                  {analysis.analysis_notes || analysis.expert_reasoning || 'Tidak ada catatan detail.'}
                </p>
                <br/>
                 <p className="text-slate-300 leading-relaxed">
                  {analysis.potential_risks || 'Tidak ada catatan detail.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}