import React, { useState, useEffect } from "react";
import { Analysis } from "@/entities/Analysis";
import { StockAnalysis } from "@/entities/StockAnalysis";
import { TradeResult } from "@/entities/TradeResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Filter, Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import HistoryFilters from "../components/history/HistoryFilters";
import AnalysisCard from "../components/history/AnalysisCard";
import AnalysisModal from "../components/history/AnalysisModal";

export default function History() {
  const navigate = useNavigate();
  const [allAnalyses, setAllAnalyses] = useState([]);
  const [tradeResults, setTradeResults] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [filters, setFilters] = useState({
    tradingType: "all",
    riskLevel: "all", 
    dateRange: "all",
    resultStatus: "all"
  });

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allAnalyses, filters, tradeResults]);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      console.log("Loading analyses...");
      
      const [cryptoData, stockData, resultsData] = await Promise.all([
        Analysis.list("-created_date", 100), // Get more records
        StockAnalysis.list("-created_date", 100), // Get more records  
        TradeResult.list("-created_date", 100)
      ]);
      
      console.log("Crypto analyses:", cryptoData.length);
      console.log("Stock analyses:", stockData.length);
      console.log("Trade results:", resultsData.length);
      
      const combinedAnalyses = [
        ...cryptoData.map(a => ({...a, analysis_type: 'crypto'})),
        ...stockData.map(a => ({...a, analysis_type: 'stock'}))
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      console.log("Total combined analyses:", combinedAnalyses.length);
      
      setAllAnalyses(combinedAnalyses);
      setTradeResults(resultsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading analyses:", error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    console.log("Applying filters to", allAnalyses.length, "analyses");
    let filtered = [...allAnalyses];

    if (filters.tradingType !== "all") {
      if (filters.tradingType === "stock") {
        filtered = filtered.filter(a => a.analysis_type === 'stock');
      } else {
        filtered = filtered.filter(a => a.analysis_type === 'crypto' && a.trading_type === filters.tradingType);
      }
    }

    if (filters.riskLevel !== "all") {
      filtered = filtered.filter(a => {
        const riskLevel = a.risk_level || a.investment_recommendation?.risk_level;
        return riskLevel === filters.riskLevel;
      });
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(a => new Date(a.created_date) >= filterDate);
    }

    // Add trade results to analyses
    filtered = filtered.map(analysis => {
      const result = tradeResults.find(r => r.analysis_id === analysis.id);
      return { ...analysis, trade_result: result };
    });

    if (filters.resultStatus !== "all") {
      if (filters.resultStatus === "tracked") {
        filtered = filtered.filter(a => a.trade_result);
      } else if (filters.resultStatus === "untracked") {
        filtered = filtered.filter(a => !a.trade_result);
      }
    }

    console.log("Filtered analyses:", filtered.length);
    setFilteredAnalyses(filtered);
  };

  const getSuccessRate = () => {
    const trackedResults = tradeResults.filter(r => r.result_status !== 'ONGOING');
    const successCount = trackedResults.filter(r => r.result_status === 'SUCCESS').length;
    return trackedResults.length > 0 ? (successCount / trackedResults.length) * 100 : 0;
  };
  
  const totalAnalysisCount = allAnalyses.length;
  const profitableCount = tradeResults.filter(r => r.result_status === 'SUCCESS').length;
  const lossCount = tradeResults.filter(r => r.result_status === 'FAILED').length;

  const handleResultUpdate = async () => {
    const resultsData = await TradeResult.list("-created_date", 100);
    setTradeResults(resultsData);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
            className="border-slate-700 hover:bg-slate-800 md:hidden"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Trading History</h1>
            <p className="text-slate-400 text-sm md:text-base">Track performance dan hasil analisis AI</p>
          </div>
          <Button
            onClick={loadAnalyses}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Success Rate Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg md:text-2xl font-bold text-white">{totalAnalysisCount}</div>
                  <div className="text-slate-400 text-xs md:text-sm">Total Analisis</div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-emerald-400">{getSuccessRate().toFixed(1)}%</div>
                  <div className="text-slate-400 text-xs md:text-sm">Success Rate</div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-blue-400">
                    {profitableCount}
                  </div>
                  <div className="text-slate-400 text-xs md:text-sm">Profitable</div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-red-400">
                    {lossCount}
                  </div>
                  <div className="text-slate-400 text-xs md:text-sm">Loss</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <HistoryFilters filters={filters} onFiltersChange={setFilters} />
        </motion.div>

        {/* Debug Info */}
        <div className="mb-4 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
          Debug: Total analyses: {allAnalyses.length}, Filtered: {filteredAnalyses.length}, Loading: {isLoading ? 'Yes' : 'No'}
        </div>

        {/* Analysis Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="glass-effect border-slate-700 animate-pulse">
                <CardContent className="p-4 md:p-6">
                  <div className="w-full h-32 md:h-40 bg-slate-700 rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-700 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allAnalyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardContent className="p-8 md:p-12 text-center">
                <Eye className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                  Belum Ada Analisis
                </h3>
                <p className="text-slate-400 mb-6">
                  Belum ada analisis yang pernah dilakukan. Mulai dengan menganalisis chart pertama Anda.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate(createPageUrl("Analyze"))}
                    className="bg-blue-600 hover:bg-blue-700 mr-2"
                  >
                    Analisis Crypto & Forex
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("StockAnalysis"))}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Analisis Saham Indonesia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredAnalyses.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {filteredAnalyses.map((analysis) => (
              <motion.div
                key={analysis.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <AnalysisCard 
                  analysis={analysis}
                  tradeResult={analysis.trade_result}
                  onClick={() => setSelectedAnalysis(analysis)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardContent className="p-8 md:p-12 text-center">
                <Filter className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                  Tidak Ada Analisis Sesuai Filter
                </h3>
                <p className="text-slate-400 mb-6">
                  Tidak ada analisis yang sesuai dengan filter yang dipilih.
                </p>
                <Button
                  onClick={() => setFilters({ tradingType: "all", riskLevel: "all", dateRange: "all", resultStatus: "all" })}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  Reset Filter
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analysis Detail Modal */}
        <AnalysisModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          onResultUpdate={handleResultUpdate}
        />
      </div>
    </div>
  );
}