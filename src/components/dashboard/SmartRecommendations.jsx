import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Building2, Zap, Newspaper, ArrowRight, RefreshCw, Target, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const actionColors = {
  STRONG_BUY: "bg-green-500/20 text-green-400 border-green-500/30",
  BUY: "bg-green-600/20 text-green-300 border-green-600/30",
  HOLD: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  SELL: "bg-red-600/20 text-red-300 border-red-600/30",
  STRONG_SELL: "bg-red-500/20 text-red-400 border-red-500/30"
};

const typeColors = {
  stock: "bg-red-500/10 text-red-400",
  crypto: "bg-blue-500/10 text-blue-400", 
  forex: "bg-purple-500/10 text-purple-400"
};

const typeIcons = {
  stock: Building2,
  crypto: TrendingUp,
  forex: Zap
};

const getPriceCategoryBadge = (price) => {
  if (price <= 1000) return { label: "Small Cap", color: "bg-emerald-500/20 text-emerald-400" };
  if (price <= 5000) return { label: "Mid Cap", color: "bg-blue-500/20 text-blue-400" };
  if (price <= 10000) return { label: "Large Cap", color: "bg-purple-500/20 text-purple-400" };
  return { label: "Blue Chip", color: "bg-amber-500/20 text-amber-400" };
};

export default function SmartRecommendations({ recommendations, isGenerating, onRefresh }) {
  const [showAll, setShowAll] = useState(false);
  
  const displayCount = showAll ? recommendations.length : 4;
  const displayedRecommendations = recommendations.slice(0, displayCount);
  
  if (recommendations.length === 0 && !isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <Card className="glass-effect border-slate-700">
          <CardContent className="p-6 text-center">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Smart Recommendations Ready
            </h3>
            <p className="text-slate-400 mb-4">
              AI akan generate rekomendasi terbaik berdasarkan analisis real-time
            </p>
            <Button 
              onClick={onRefresh}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 md:mb-8"
    >
      <Card className="glass-effect border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              🚀 Smart AI Recommendations
            </CardTitle>
            <p className="text-slate-400 text-sm">Rekomendasi terbaik hari ini - Semua kategori harga saham Indonesia</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isGenerating}
            className="border-slate-600 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''} text-white`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                <AnimatePresence>
                  {displayedRecommendations.map((rec, index) => {
                    const TypeIcon = typeIcons[rec.recommendation_type];
                    const priceCategory = rec.recommendation_type === 'stock' ? 
                      getPriceCategoryBadge(rec.current_price || 0) : null;
                    
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link to={createPageUrl(`RecommendationDetail?id=${rec.id}`)}>
                          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all cursor-pointer border border-slate-700/50 hover:border-emerald-500/30">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${typeColors[rec.recommendation_type]}`}>
                              <TypeIcon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-white text-sm md:text-base">
                                  {rec.asset_symbol}
                                </h4>
                                <Badge variant="outline" className={actionColors[rec.recommendation_action]}>
                                  {rec.recommendation_action}
                                </Badge>
                                {priceCategory && (
                                  <Badge className={`text-xs ${priceCategory.color}`}>
                                    {priceCategory.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-slate-400 truncate">
                                {rec.asset_name}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                                <span className="text-emerald-400">
                                  Target: +{rec.expected_return_percent?.toFixed(1) || 0}%
                                </span>
                                <span className="text-slate-500">
                                  {rec.time_horizon}
                                </span>
                                {rec.recommendation_type === 'stock' && (
                                  <span className="text-blue-400">
                                    {rec.current_price <= 5000 ? 'Terjangkau' : 'Premium'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm md:text-base font-bold text-white">
                                {rec.recommendation_type === 'stock' ? 'Rp ' : '$'}
                                {rec.current_price?.toLocaleString() || '-'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {rec.confidence_score || 90}% confidence
                              </div>
                              {rec.recommendation_type === 'stock' && rec.current_price <= 2000 && (
                                <div className="text-xs text-emerald-400 mt-1">
                                  Small Cap Gem
                                </div>
                              )}
                            </div>

                            <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {recommendations.length > 4 && (
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={() => setShowAll(!showAll)}
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800 text-white"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show More ({recommendations.length - 4} more)
                      </>
                    )}
                  </Button>
                  
                  {!showAll && (
                    <div className="mt-2 text-xs text-slate-500">
                      Including small cap & new IPO stocks with affordable prices
                    </div>
                  )}
                </motion.div>
              )}

              {recommendations.some(r => r.recommendation_type === 'stock') && (
                <motion.div 
                  className="mt-6 p-4 rounded-xl bg-slate-800/20 border border-slate-700"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    🇮🇩 Kategori Saham Indonesia
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                      <div className="font-semibold">Small Cap</div>
                      <div className="text-slate-400">≤ Rp 1,000</div>
                    </div>
                    <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                      <div className="font-semibold">Mid Cap</div>
                      <div className="text-slate-400">Rp 1,000 - 5,000</div>
                    </div>
                    <div className="p-2 rounded bg-purple-500/10 text-purple-400">
                      <div className="font-semibold">Large Cap</div>
                      <div className="text-slate-400">Rp 5,000 - 10,000</div>
                    </div>
                    <div className="p-2 rounded bg-amber-500/10 text-amber-400">
                      <div className="font-semibold">Blue Chip</div>
                      <div className="text-slate-400">&gt; Rp 10,000</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}