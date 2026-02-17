import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw, Plus, BarChart2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import SignalDetailModal from "../components/signals/SignalDetailModal";

export default function SignalsPage() {
  const [signals, setSignals] = useState([]);
  const [filteredSignals, setFilteredSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState(null);
  
  // Filters
  const [symbolFilter, setSymbolFilter] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState("all");
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  useEffect(() => {
    loadSignals();
    
    // Real-time subscription to new signals
    const unsubscribe = base44.entities.Signal.subscribe((event) => {
      if (event.type === 'create') {
        setSignals(prev => [event.data, ...prev]);
        toast.success(`New signal: ${event.data.symbol} ${event.data.direction.toUpperCase()}`);
      } else if (event.type === 'update') {
        setSignals(prev => prev.map(s => s.id === event.id ? event.data : s));
      } else if (event.type === 'delete') {
        setSignals(prev => prev.filter(s => s.id !== event.id));
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [signals, symbolFilter, timeframeFilter, triggerTypeFilter, minScoreFilter]);

  const loadSignals = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Signal.list("-created_date", 100);
      console.log('Loaded signals:', data.length, data);
      setSignals(data);
    } catch (error) {
      console.error("Failed to load signals:", error);
    }
    setIsLoading(false);
  };

  const createTestSignal = async () => {
    try {
      const result = await base44.functions.invoke('signals-seed', {});
      toast.success(`Test signal created: ${result.data.signalId}`);
      await loadSignals();
    } catch (error) {
      console.error('Failed to create test signal:', error);
      toast.error('Failed to create test signal');
    }
  };

  const testWebhook = async () => {
    try {
      // Authenticated users can test the webhook without secret
      const result = await base44.functions.invoke('tradingview-webhook', {
        symbol: "ETHUSDT",
        exchange: "BINANCE",
        timeframe: "1h",
        triggerType: "MSS",
        direction: "short",
        price: 2350.75,
        meta: {
          volumeSpike: true,
          htfAlign: true
        }
      });
      
      if (result.data.accepted) {
        toast.success(`Webhook test successful! Score: ${result.data.score}`);
        await loadSignals();
      } else {
        toast.error('Webhook rejected signal');
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      toast.error('Webhook test failed');
    }
  };

  const applyFilters = () => {
    let filtered = [...signals];

    if (symbolFilter) {
      filtered = filtered.filter(s => 
        s.symbol?.toLowerCase().includes(symbolFilter.toLowerCase())
      );
    }

    if (timeframeFilter !== "all") {
      filtered = filtered.filter(s => s.timeframe === timeframeFilter);
    }

    if (triggerTypeFilter !== "all") {
      filtered = filtered.filter(s => s.triggerType === triggerTypeFilter);
    }

    if (minScoreFilter > 0) {
      filtered = filtered.filter(s => s.score >= minScoreFilter);
    }

    setFilteredSignals(filtered);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (score >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  };

  const createPaperTrade = async (signal) => {
    try {
      const entryPrice = signal.price || 0;
      const stopDistance = entryPrice * 0.02; // 2% stop loss
      const stopLoss = signal.direction === 'long' 
        ? entryPrice - stopDistance 
        : entryPrice + stopDistance;
      
      const targets = {
        tp1: signal.direction === 'long' ? entryPrice * 1.015 : entryPrice * 0.985,
        tp2: signal.direction === 'long' ? entryPrice * 1.03 : entryPrice * 0.97,
        tp3: signal.direction === 'long' ? entryPrice * 1.05 : entryPrice * 0.95
      };

      const trade = await base44.entities.PaperTrade.create({
        symbol: signal.symbol,
        exchange: signal.exchange,
        side: signal.direction,
        entry: entryPrice,
        stop: stopLoss,
        targetsJson: targets,
        sizeUsd: 1000,
        openedAt: new Date().toISOString()
      });

      toast.success(`Paper trade created for ${signal.symbol}`);
    } catch (error) {
      console.error('Failed to create paper trade:', error);
      toast.error('Failed to create paper trade');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Trading Signals</h1>
            <p className="text-slate-300">Real-time alerts from TradingView</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={createTestSignal}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Test
            </Button>
            <Button
              onClick={testWebhook}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Test Webhook
            </Button>
            <Button
              onClick={loadSignals}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl mb-6">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search symbol..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white"
            />
            
            <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
              </SelectContent>
            </Select>

            <Select value={triggerTypeFilter} onValueChange={setTriggerTypeFilter}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Trigger Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="EMA_FLIP">EMA Flip</SelectItem>
                <SelectItem value="MSS">Market Structure Shift</SelectItem>
                <SelectItem value="RSI_DIV">RSI Divergence</SelectItem>
              </SelectContent>
            </Select>

            <Select value={minScoreFilter.toString()} onValueChange={(v) => setMinScoreFilter(Number(v))}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Scores</SelectItem>
                <SelectItem value="50">50+</SelectItem>
                <SelectItem value="60">60+</SelectItem>
                <SelectItem value="70">70+ (High Quality)</SelectItem>
                <SelectItem value="80">80+</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Signals List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading signals...</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No signals found</p>
              <p className="text-slate-500 text-sm mt-2">
                {signals.length > 0 ? "Try adjusting your filters" : "Waiting for incoming signals from TradingView webhook"}
              </p>
              {signals.length === 0 && (
                <Button
                  onClick={createTestSignal}
                  className="mt-6 bg-blue-600 hover:bg-blue-700"
                >
                  Create Test Signal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal, index) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl hover:bg-slate-800/70 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Symbol & Direction */}
                      <div className="flex items-center gap-3" onClick={() => setSelectedSignal(signal)}>
                        <div className={`p-2 rounded-lg ${
                          signal.direction === 'long' 
                            ? 'bg-green-500/20' 
                            : 'bg-red-500/20'
                        }`}>
                          {signal.direction === 'long' ? (
                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{signal.symbol}</h3>
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              {signal.exchange}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">
                            {signal.direction.toUpperCase()} • {signal.timeframe}
                          </p>
                        </div>
                      </div>

                      {/* Trigger & Score */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                            {signal.triggerType}
                          </Badge>
                          {signal.price && (
                            <p className="text-sm text-slate-400 mt-1">
                              ${signal.price.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className={`px-4 py-2 rounded-lg border ${getScoreColor(signal.score)}`}>
                          <div className="text-2xl font-bold">{signal.score}</div>
                          <div className="text-xs">Score</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              createPaperTrade(signal);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <BarChart2 className="w-4 h-4 mr-1" />
                            Simuler handel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSignal(signal);
                            }}
                            className="border-slate-600 hover:bg-slate-800"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right text-slate-400 text-sm">
                          {format(new Date(signal.created_date), 'MMM d, HH:mm')}
                        </div>
                        </div>
                        </div>
                        </CardContent>
                        </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Signal Detail Modal */}
        <SignalDetailModal
          signal={selectedSignal}
          onClose={() => setSelectedSignal(null)}
          onCreatePaperTrade={createPaperTrade}
        />
      </div>
    </div>
  );
}