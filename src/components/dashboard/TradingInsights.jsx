import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Shield, Zap } from "lucide-react";

export default function TradingInsights({ analyses }) {
  const getInsights = () => {
    if (analyses.length === 0) return {};

    const spotCount = analyses.filter(a => a.trading_type === 'spot').length;
    const forexCount = analyses.filter(a => a.trading_type === 'forex').length;
    const highConfidenceCount = analyses.filter(a => a.confidence_score > 80).length;
    const mostCommonRisk = analyses.reduce((acc, curr) => {
      acc[curr.risk_level] = (acc[curr.risk_level] || 0) + 1;
      return acc;
    }, {});
    
    const dominantRisk = Object.keys(mostCommonRisk).reduce((a, b) => 
      mostCommonRisk[a] > mostCommonRisk[b] ? a : b, 'medium'
    );

    return { spotCount, forexCount, highConfidenceCount, dominantRisk };
  };

  const insights = getInsights();

  return (
    <div className="space-y-6">
      {/* Market Insights */}
      <Card className="glass-effect border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Trading Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">Spot Trading</span>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {insights.spotCount || 0}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">Forex Trading</span>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              {insights.forexCount || 0}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">High Confidence</span>
            </div>
            <Badge variant="outline" className="border-green-500/30 text-green-400">
              {insights.highConfidenceCount || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card className="glass-effect border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
              insights.dominantRisk === 'low' ? 'bg-green-500/20' :
              insights.dominantRisk === 'medium' ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              <Shield className={`w-8 h-8 ${
                insights.dominantRisk === 'low' ? 'text-green-400' :
                insights.dominantRisk === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`} />
            </div>
            <h4 className="font-semibold text-white mb-1">
              {insights.dominantRisk === 'low' ? 'Low Risk' :
               insights.dominantRisk === 'medium' ? 'Medium Risk' : 'High Risk'}
            </h4>
            <p className="text-sm text-gray-400">
              Mayoritas analisis Anda
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Tips */}
      <Card className="glass-effect border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">AI Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300">
                💡 Gunakan stop loss untuk melindungi modal Anda
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-green-300">
                📈 Take profit secara bertahap untuk maksimalkan keuntungan
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-purple-300">
                🎯 Perhatikan confidence score AI sebelum trading
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}