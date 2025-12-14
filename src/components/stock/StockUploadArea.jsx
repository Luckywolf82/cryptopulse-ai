import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image, Camera, Building2, TrendingUp, Newspaper } from "lucide-react";
import { motion } from "framer-motion";

export default function StockUploadArea({ onImageUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onImageUpload(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onImageUpload(files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-effect border-slate-700 overflow-hidden">
        <CardContent className="p-0">
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-slate-800 to-red-900 p-6 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Indonesian Stock Chart Analyzer</h3>
                <p className="text-slate-300 text-sm">AI + Real-time news untuk analisis saham BEI</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? "border-red-400 bg-red-500/10 scale-[1.02]" 
                  : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <motion.div
                animate={{ 
                  scale: dragActive ? 1.1 : 1,
                  rotate: dragActive ? 5 : 0
                }}
                transition={{ duration: 0.2 }}
                className="w-24 h-24 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <Upload className="w-12 h-12 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                Upload Chart Saham Indonesia
              </h3>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                Drag & drop gambar chart saham BEI atau klik tombol di bawah. 
                AI akan melakukan <span className="text-red-400 font-semibold">analisis komprehensif</span> dengan 
                data fundamental dan berita real-time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Image className="w-5 h-5 mr-2" />
                  Pilih Chart Saham
                </Button>
                
                <Button
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800 text-white px-8 py-4 rounded-xl"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Screenshot Chart
                </Button>
              </div>

              {/* Premium Features List */}
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <TrendingUp className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <div className="text-red-300 font-semibold">Technical Analysis</div>
                  <div className="text-slate-400">Pattern + indicator BEI standards</div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Newspaper className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                  <div className="text-orange-300 font-semibold">Real-time News</div>
                  <div className="text-slate-400">Berita fundamental analysis</div>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <Building2 className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <div className="text-yellow-300 font-semibold">Investment Advice</div>
                  <div className="text-slate-400">BUY/SELL recommendation</div>
                </div>
              </div>

              {/* Supported Stocks */}
              <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <h4 className="text-white font-semibold mb-3">🇮🇩 Saham Indonesia yang Didukung</h4>
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  {['BBCA', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'GOTO', 'BUKA', 'EMTK', 'ICBP', 'KLBF'].map(stock => (
                    <span key={stock} className="px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                      {stock}
                    </span>
                  ))}
                  <span className="px-2 py-1 bg-slate-600/20 text-slate-400 rounded">+ 700+ saham BEI lainnya</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-8 border-t border-slate-700 pt-4">
                <strong>Supported formats:</strong> JPG, PNG, WebP (Max 10MB) • 
                <strong> Best results:</strong> Screenshot dari broker/platform trading Indonesia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}