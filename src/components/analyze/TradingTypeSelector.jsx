import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, BarChart3, Shield, Zap, Target, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function TradingTypeSelector({ uploadedImage, onTypeSelect, onBack }) {
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
                Pilih Jenis Trading
              </CardTitle>
              <p className="text-slate-400 mt-1">
                Pilih jenis trading untuk optimasi analisis AI yang lebih akurat
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
                <h3 className="text-2xl font-bold text-white mb-2">Spot Trading</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Trading spot crypto dengan kepemilikan aset langsung. 
                  Ideal untuk investor jangka panjang dan pemula.
                </p>
              </div>

              {/* Features Grid */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">Leverage:</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">1:1 (No Leverage)</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">Risk Level:</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Conservative</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">Ownership:</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Real Asset</Badge>
                </div>
              </div>

              {/* Best For */}
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-emerald-300 font-semibold mb-2">✅ Best For:</h4>
                <ul className="text-sm text-emerald-200 space-y-1">
                  <li>• Long-term investment strategy</li>
                  <li>• Capital preservation focus</li>
                  <li>• Beginners to crypto trading</li>
                  <li>• Buy-and-hold approach</li>
                </ul>
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
                <h3 className="text-2xl font-bold text-white mb-2">Forex/Leverage Trading</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Trading dengan leverage tinggi untuk profit maksimal. 
                  Cocok untuk trader berpengalaman dengan risk appetite tinggi.
                </p>
              </div>

              {/* Features Grid */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Leverage:</span>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">Up to 1:100</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-sm">Risk Level:</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400">Aggressive</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Position Type:</span>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">Contract CFD</Badge>
                </div>
              </div>

              {/* Best For */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="text-blue-300 font-semibold mb-2">⚡ Best For:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Experienced traders</li>
                  <li>• Short-term profit opportunities</li>
                  <li>• High-risk high-reward strategy</li>
                  <li>• Both BUY and SELL positions</li>
                </ul>
              </div>

              {/* Risk Warning */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-semibold text-sm">High Risk Warning</span>
                </div>
                <p className="text-xs text-amber-200">
                  Leveraged trading can result in significant losses. Only use funds you can afford to lose.
                </p>
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
                <h4 className="font-semibold text-white mb-2">🧠 AI Optimization</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Pemilihan jenis trading akan mengoptimalkan algoritma analisis AI kami. 
                  Setiap jenis trading memiliki parameter risk management dan pattern recognition yang berbeda 
                  untuk memberikan hasil analisis yang paling akurat sesuai dengan strategi trading Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}