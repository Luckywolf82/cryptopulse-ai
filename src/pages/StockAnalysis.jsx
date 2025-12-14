
import React, { useState } from "react";
import { StockAnalysis } from "@/entities/StockAnalysis";
import { UploadFile, InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Building2, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

import StockUploadArea from "../components/stock/StockUploadArea";
import StockAnalysisResult from "../components/stock/StockAnalysisResult";

export default function StockAnalysisPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: upload, 2: analyzing, 3: results
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUpload = async (file) => {
    console.log("Starting stock file upload:", file.name, file.type, file.size);
    setError(null);
    
    try {
      console.log("Calling UploadFile integration for stock...");
      const result = await UploadFile({ file });
      console.log("Stock upload result:", result);
      
      if (result && result.file_url) {
        setUploadedImage({ file, url: result.file_url });
        setStep(2);
        startAnalysis(result.file_url);
      } else {
        throw new Error("Upload result tidak memiliki file_url");
      }
    } catch (error) {
      console.error("Stock upload error details:", error);
      setError(`Gagal mengupload gambar: ${error.message || 'Unknown error'}. Silakan coba lagi dengan gambar yang lebih kecil (<5MB).`);
    }
  };

  const startAnalysis = async (imageUrl) => {
    setIsAnalyzing(true);
    console.log("Starting stock analysis with image URL:", imageUrl);
    
    try {
      // PHASE 0: Intelligent Image Validation
      console.log("Stock Phase 0: Image validation");
      const validationResult = await InvokeLLM({
          prompt: `You are a specialist image classifier. Your ONLY task is to determine if this image contains a financial trading chart (like candlestick, bar, or line charts). Answer ONLY with a JSON object following this exact structure: {"is_chart": boolean, "reason": "Your brief reasoning why it is or is not a chart."}.`,
          file_urls: [imageUrl],
          response_json_schema: {
              type: "object",
              properties: {
                  is_chart: { type: "boolean" },
                  reason: { type: "string" }
              },
              required: ["is_chart", "reason"]
          }
      });

      console.log("Stock validation result:", validationResult);

      if (!validationResult.is_chart) {
          setError("GAMBAR TIDAK VALID: Gambar yang diupload bukan chart trading. Mohon upload screenshot candlestick chart saham yang jelas.");
          setIsAnalyzing(false);
          setStep(1); // Go back to upload step
          return;
      }

      // PHASE 1: Technical Analysis of Indonesian Stock Chart
      console.log("Stock Phase 1: Technical analysis");
      const technicalAnalysis = await InvokeLLM({
        prompt: `Anda adalah SENIOR EQUITY ANALYST Indonesia dengan pengalaman 15+ tahun di BEI (Bursa Efek Indonesia).

TUGAS ANALISIS SAHAM INDONESIA:
Analisis gambar chart saham Indonesia ini dengan expertise pasar modal Indonesia.

INSTRUKSI PEMBACAAN CHART:
1. **IDENTIFIKASI SAHAM**: Baca kode saham (BBCA, TLKM, GOTO, dll) dari chart
2. **ANALISIS TEKNIKAL (1000+ PATTERN)**: Gunakan library pattern luas (Head & Shoulders, Triangles, Flags, Wedges, Doji, Hammer, Engulfing), plus indikator (RSI, MACD, MA, Bollinger Bands).
3. **VOLUME ANALYSIS**: Analisis volume jika terlihat
4. **TIMEFRAME**: Tentukan periode chart (1D, 1W, 1M, dll)
5. **HARGA**: Baca harga current, high, low dari chart

KONTEKS PASAR INDONESIA:
- Jam trading BEI: 09:00-16:00 WIB
- Familiar dengan blue chips: BBCA, BMRI, TLKM, ASII, UNVR
- Sektor unggulan: Banking, Mining, Consumer, Technology
- Auto reject jika lot odd (minimal 1 lot = 100 saham)
- Pertimbangkan foreign flow dan retail sentiment

Target akurasi: 95%+`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            stock_identification: {
              type: "object",
              properties: {
                stock_code: { type: "string", description: "Kode saham dari chart" },
                stock_name: { type: "string", description: "Nama perusahaan jika dikenal" },
                sector: { type: "string", description: "Sektor industri" },
                current_price: { type: "number", description: "Harga saat ini" },
                price_change: { type: "number", description: "Perubahan harga" },
                price_change_percent: { type: "number", description: "Perubahan persen" }
              }
            },
            technical_analysis: {
              type: "object",
              properties: {
                trend_direction: { 
                  type: "string", 
                  enum: ["bullish", "bearish", "sideways"] 
                },
                pattern_detected: { type: "string" },
                support_levels: { type: "array", items: { type: "number" } },
                resistance_levels: { type: "array", items: { type: "number" } },
                technical_indicators: {
                  type: "object",
                  properties: {
                    rsi: { type: "string" },
                    macd: { type: "string" },
                    moving_average: { type: "string" },
                    bollinger_bands: { type: "string" }
                  }
                },
                volume_analysis: { type: "string" }
              }
            },
            timeframe_detected: { type: "string" },
            initial_confidence: { type: "number", description: "Confidence 85-98%" }
          },
          required: ["stock_identification", "technical_analysis", "timeframe_detected", "initial_confidence"]
        }
      });
      console.log("Stock technical analysis completed");

      // PHASE 2: Get Real-time News and Fundamental Data
      console.log("Stock Phase 2: News and Fundamental data");
      const newsAndFundamental = await InvokeLLM({
        prompt: `Anda adalah FUNDAMENTAL ANALYST & NEWS RESEARCHER untuk saham Indonesia.

SAHAM YANG DIANALISIS: ${technicalAnalysis?.stock_identification?.stock_code || 'UNKNOWN'}
PERUSAHAAN: ${technicalAnalysis?.stock_identification?.stock_name || 'Unknown Company'}

TUGAS RISET FUNDAMENTAL & NEWS:
1. **BERITA TERKINI**: Cari berita 7 hari terakhir yang mempengaruhi saham ini
2. **FUNDAMENTAL METRICS**: Estimasi PE, PBV, dividend yield berdasarkan knowledge
3. **CATALYST ANALYSIS**: Faktor-faktor yang bisa menggerakkan harga
4. **SECTOR OUTLOOK**: Prospek sektor industri

KRITERIA BERITA PENTING:
- Laporan keuangan/financial report
- Akuisisi, ekspansi, merger
- Regulasi pemerintah yang berdampak
- Management changes
- Dividend announcement
- Stock split/rights issue

Gunakan knowledge terkini dan add_context_from_internet untuk data real-time.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
                  impact_score: { type: "number", description: "1-10 score" },
                  source: { type: "string" },
                  date: { type: "string" }
                }
              }
            },
            fundamental_metrics: {
              type: "object",
              properties: {
                pe_ratio: { type: "number" },
                pbv_ratio: { type: "number" },
                dividend_yield: { type: "number" },
                market_cap: { type: "string" },
                revenue_growth: { type: "string" },
                profit_margin: { type: "string" },
                debt_to_equity: { type: "number" }
              }
            },
            key_catalysts: {
              type: "array",
              items: { type: "string" },
              description: "Katalis utama yang mempengaruhi harga"
            },
            sector_outlook: { type: "string" },
            market_sentiment: { 
              type: "string", 
              enum: ["very_positive", "positive", "neutral", "negative", "very_negative"] 
            }
          },
          required: ["news_analysis", "fundamental_metrics", "key_catalysts", "sector_outlook", "market_sentiment"]
        }
      });

      // PHASE 3: Investment Recommendation
      console.log("Stock Phase 3: Investment Recommendation");
      const investmentRecommendation = await InvokeLLM({
        prompt: `Anda adalah SENIOR PORTFOLIO MANAGER Indonesia dengan AUM Rp 5 Triliun.

COMBINE ANALYSIS:
Technical: ${JSON.stringify(technicalAnalysis, null, 2)}
Fundamental & News: ${JSON.stringify(newsAndFundamental, null, 2)}

TUGAS FINAL RECOMMENDATION:
1. **BUY/SELL/HOLD DECISION**: Berdasarkan gabungan teknikal + fundamental
2. **TARGET PRICE**: Hitung berdasarkan valuation dan technical target
3. **TIMING STRATEGY**: Kapan waktu terbaik untuk entry
4. **RISK ASSESSMENT**: Identifikasi risiko utama
5. **PORTFOLIO ALLOCATION**: Berapa % yang disarankan

KRITERIA REKOMENDASI:
- STRONG_BUY: Technical bullish + fundamental excellent + positive news
- BUY: Technical ok + fundamental good + neutral/positive news  
- HOLD: Mixed signals, tunggu konfirmasi
- SELL: Technical bearish + fundamental concerns
- STRONG_SELL: Major red flags di teknikal dan fundamental

PERTIMBANGAN KHUSUS INDONESIA:
- Likuiditas saham (average volume)
- Foreign ownership limits
- Dividen track record
- Management quality
- Regulatory environment`,
        response_json_schema: {
          type: "object",
          properties: {
            investment_recommendation: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]
                },
                target_price: { type: "number" },
                stop_loss: { type: "number" },
                time_horizon: {
                  type: "string",
                  enum: ["short_term", "medium_term", "long_term"]
                },
                entry_timing: { type: "string" },
                risk_level: {
                  type: "string",
                  enum: ["low", "medium", "high"]
                },
                position_sizing: { type: "string", description: "% portfolio allocation" }
              }
            },
            analysis_summary: { type: "string", description: "Executive summary" },
            risk_factors: {
              type: "array",
              items: { type: "string" }
            },
            confidence_score: { type: "number", description: "Final confidence 88-97%" },
            next_review_date: { type: "string" }
          },
          required: ["investment_recommendation", "analysis_summary", "risk_factors", "confidence_score"]
        }
      });

      // Compile Final Stock Analysis
      const analysisData = {
        image_url: imageUrl,
        stock_code: technicalAnalysis?.stock_identification?.stock_code || 'UNKNOWN',
        stock_name: technicalAnalysis?.stock_identification?.stock_name || 'Unknown Company',
        sector: technicalAnalysis?.stock_identification?.sector || 'Unknown Sector',
        current_price: technicalAnalysis?.stock_identification?.current_price,
        price_change: technicalAnalysis?.stock_identification?.price_change,
        price_change_percent: technicalAnalysis?.stock_identification?.price_change_percent,
        timeframe: technicalAnalysis?.timeframe_detected || '1D',
        
        technical_analysis: {
          trend_direction: technicalAnalysis?.technical_analysis?.trend_direction || 'sideways',
          support_levels: technicalAnalysis?.technical_analysis?.support_levels || [],
          resistance_levels: technicalAnalysis?.technical_analysis?.resistance_levels || [],
          pattern_detected: technicalAnalysis?.technical_analysis?.pattern_detected || 'No clear pattern',
          technical_indicators: technicalAnalysis?.technical_analysis?.technical_indicators || {}
        },
        
        fundamental_analysis: newsAndFundamental?.fundamental_metrics || {},
        news_analysis: newsAndFundamental?.news_analysis || [],
        
        investment_recommendation: investmentRecommendation?.investment_recommendation || {
          action: 'HOLD',
          target_price: null,
          stop_loss: null,
          time_horizon: 'medium_term',
          entry_timing: 'Wait for confirmation',
          risk_level: 'medium'
        },
        
        confidence_score: Math.min(97, Math.max(88, investmentRecommendation?.confidence_score || 90)),
        analysis_summary: investmentRecommendation?.analysis_summary || 'Analysis summary not available',
        key_catalysts: newsAndFundamental?.key_catalysts || [],
        risk_factors: investmentRecommendation?.risk_factors || []
      };

      console.log("Saving stock analysis to database...");
      const savedAnalysis = await StockAnalysis.create(analysisData);
      console.log("Stock analysis saved successfully:", savedAnalysis.id);

      setAnalysisResult(savedAnalysis);
      setStep(3);
    } catch (error) {
      console.error("Stock analysis error:", error);
      setError(`Gagal menganalisis saham: ${error.message}. Pastikan chart saham Indonesia yang jelas.`);
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setStep(1);
    setUploadedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="border-slate-700 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Indonesian Stock Analyzer</h1>
              <p className="text-slate-400">Analisis saham BEI dengan AI + berita real-time</p>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="border-red-500 bg-red-500/10">
              <CardContent className="p-4">
                <p className="text-red-400 font-medium">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <StockUploadArea onImageUpload={handleImageUpload} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <Card className="glass-effect border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <TrendingUp className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    🇮🇩 Analyzing Indonesian Stock...
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Menggunakan AI expert untuk analisis teknikal + fundamental + berita terkini
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">1</span>
                      </div>
                      <span className="text-slate-300">Technical analysis BEI standards...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Newspaper className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-300">Fetching real-time news & data...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-300">Fundamental analysis & valuation...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">4</span>
                      </div>
                      <span className="text-slate-300">Investment recommendation...</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    Comprehensive stock analysis membutuhkan 15-20 detik...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && analysisResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StockAnalysisResult
                analysis={analysisResult}
                uploadedImage={uploadedImage}
                onNewAnalysis={resetAnalysis}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
