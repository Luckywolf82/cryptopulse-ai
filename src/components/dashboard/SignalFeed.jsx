import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Zap, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function SignalFeed() {
  const [signals, setSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHighQualitySignals();
  }, []);

  const loadHighQualitySignals = async () => {
    setIsLoading(true);
    try {
      const allSignals = await base44.entities.Signal.list("-created_date", 50);
      const highQuality = allSignals.filter(s => s.score >= 70).slice(0, 5);
      setSignals(highQuality);
    } catch (error) {
      console.error("Failed to load signals:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            High Quality Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            High Quality Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No high quality signals yet</p>
            <p className="text-slate-500 text-sm mt-1">Score 70+ signals will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          High Quality Signals
        </CardTitle>
        <Link to={createPageUrl("Signals")}>
          <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
            View All
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.map((signal, index) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:bg-slate-900/70 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${
                    signal.direction === 'long' 
                      ? 'bg-green-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    {signal.direction === 'long' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{signal.symbol}</span>
                      <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                        {signal.timeframe}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {signal.triggerType} • {format(new Date(signal.created_date), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">{signal.score}</div>
                  <div className="text-xs text-slate-500">score</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}