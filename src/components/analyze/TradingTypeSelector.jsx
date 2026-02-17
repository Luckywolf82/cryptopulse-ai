import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, BarChart3, Shield, Zap, Target, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function TradingTypeSelector({ uploadedImage, onTypeSelect, onBack }) {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-effect border-slate-700 mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="border-slate-600 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {t('analyze.typeSelector.title')}
              </CardTitle>
              <p className="text-slate-400 mt-1">
                {t('analyze.typeSelector.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={uploadedImage.url}
                alt="Uploaded chart"
                className="max-w-md rounded-xl shadow-2xl border border-slate-600"
              />
              <div className="absolute top-3 right-3">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  ✓ Chart Uploaded
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Spot Trading */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Card 
            className="glass-effect border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-all duration-300 overflow-hidden group h-full"
            onClick={() => onTypeSelect("spot")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardContent className="p-8 relative">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('analyze.typeSelector.spot.title')}</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  {t('analyze.typeSelector.spot.description')}
                </p>
              </div>

              {/* Features Grid */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">Leverage:</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{t('analyze.typeSelector.spot.leverage')}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">{t('analyze.typeSelector.spot.risk')}</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{t('analyze.typeSelector.spot.risk').split(': ')[1]}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">{t('analyze.typeSelector.spot.ownership').split(':')[0]}:</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{t('analyze.typeSelector.spot.ownership').split(': ')[1]}</Badge>
                </div>
              </div>

              {/* Best For */}
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-emerald-300 font-semibold mb-2">✅ {t('analyze.typeSelector.spot.bestFor')}</h4>
                <p className="text-sm text-emerald-200">{t('analyze.typeSelector.spot.bestFor').split(': ')[1]}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Forex/Leverage Trading */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Card 
            className="glass-effect border-slate-700 cursor-pointer hover:border-blue-500/50 transition-all duration-300 overflow-hidden group h-full"
            onClick={() => onTypeSelect("forex")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardContent className="p-8 relative">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('analyze.typeSelector.forex.title')}</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  {t('analyze.typeSelector.forex.description')}
                </p>
              </div>

              {/* Features Grid */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Leverage:</span>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">{t('analyze.typeSelector.forex.leverage')}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-sm">{t('analyze.typeSelector.forex.risk').split(':')[0]}:</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400">{t('analyze.typeSelector.forex.risk').split(': ')[1]}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">{t('analyze.typeSelector.forex.position').split(':')[0]}:</span>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">{t('analyze.typeSelector.forex.position').split(': ')[1]}</Badge>
                </div>
              </div>

              {/* Best For */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="text-blue-300 font-semibold mb-2">⚡ {t('analyze.typeSelector.forex.bestFor')}</h4>
                <p className="text-sm text-blue-200">{t('analyze.typeSelector.forex.bestFor').split(': ')[1]}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Optimization Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Card className="glass-effect border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">🧠 {t('analyze.typeSelector.aiOptimization')}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {t('analyze.typeSelector.aiOptDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}