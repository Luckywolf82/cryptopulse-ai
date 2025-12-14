import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image, Camera, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function UploadArea({ onImageUpload }) {
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
          <div className="bg-gradient-to-r from-slate-800 to-blue-900 p-6 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Professional Chart Analyzer</h3>
                <p className="text-slate-300 text-sm">Institutional-grade AI dengan akurasi 95%+</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? "border-emerald-400 bg-emerald-500/10 scale-[1.02]" 
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
                className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <Upload className="w-12 h-12 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                Upload Chart Candlestick
              </h3>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                Drag & drop gambar chart atau klik tombol di bawah. AI kami akan melakukan 
                analisis <span className="text-emerald-400 font-semibold">institutional-grade</span> dengan 
                metodologi trader profesional.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Image className="w-5 h-5 mr-2" />
                  Pilih Gambar Chart
                </Button>
                
                <Button
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800 text-white px-8 py-4 rounded-xl"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Ambil Screenshot
                </Button>
              </div>

              {/* Premium Features List */}
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <div className="text-emerald-300 font-semibold">50+ Patterns</div>
                  <div className="text-slate-400">Comprehensive pattern library</div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-blue-300 font-semibold">Multi-Layer AI</div>
                  <div className="text-slate-400">4-phase analysis process</div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="w-5 h-5 mx-auto mb-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded text-xs flex items-center justify-center text-white font-bold">95%</div>
                  <div className="text-purple-300 font-semibold">High Accuracy</div>
                  <div className="text-slate-400">Institutional precision</div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-8 border-t border-slate-700 pt-4">
                <strong>Supported formats:</strong> JPG, PNG, WebP (Max 10MB) • 
                <strong> Best results:</strong> Clear charts dengan visible price levels dan timeframe
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}