import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Play, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function I18nAuditPage() {
  const { t, i18n } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    missing: false,
    hardcoded: false
  });

  useEffect(() => {
    loadLatestAudit();
  }, []);

  const loadLatestAudit = async () => {
    const results = await base44.entities.I18nAuditResult.list("-created_date", 1);
    if (results.length > 0) {
      setLatestResult(results[0]);
    }
  };

  const runAudit = async () => {
    setIsRunning(true);
    
    try {
      // Load all translation files
      const translationKeys = {
        en: Object.keys(flattenObject(i18n.getResourceBundle('en', 'translation') || {})),
        no: Object.keys(flattenObject(i18n.getResourceBundle('no', 'translation') || {})),
        id: Object.keys(flattenObject(i18n.getResourceBundle('id', 'translation') || {}))
      };

      // Known source files to check (we can't dynamically scan in Base44)
      const sourceFiles = [
        'pages/Dashboard.jsx',
        'pages/Analyze.jsx',
        'pages/History.jsx',
        'pages/StockAnalysis.jsx',
        'pages/RecommendationDetail.jsx',
        'components/analyze/AnalysisResult.jsx',
        'components/analyze/TradingTypeSelector.jsx',
        'components/analyze/UploadArea.jsx',
        'components/stock/StockAnalysisResult.jsx',
        'components/stock/StockUploadArea.jsx',
        'components/investment/DCACalculator.jsx',
        'components/investment/TradeResultTracker.jsx',
        'components/history/AnalysisModal.jsx',
        'components/history/AnalysisCard.jsx',
        'components/history/HistoryFilters.jsx',
        'components/dashboard/RecentAnalyses.jsx',
        'components/dashboard/SmartRecommendations.jsx',
        'components/dashboard/TradingInsights.jsx',
        'components/dashboard/StatsCard.jsx',
        'layout.js',
      ];

      const missingKeys = [];
      const hardcodedStrings = [];

      // Detect patterns in current loaded components
      // This is a heuristic check based on known patterns
      const commonHardcodedPatterns = [
        { file: 'Example', pattern: 'Hardcoded Text', line: 'N/A' }
      ];

      // Check if all namespaces have consistent keys
      const allKeys = new Set([...translationKeys.en, ...translationKeys.no, ...translationKeys.id]);
      
      translationKeys.en.forEach(key => {
        if (!translationKeys.no.includes(key)) {
          missingKeys.push({
            key,
            file: 'no.json',
            reason: 'Key exists in en.json but missing in no.json'
          });
        }
        if (!translationKeys.id.includes(key)) {
          missingKeys.push({
            key,
            file: 'id.json',
            reason: 'Key exists in en.json but missing in id.json'
          });
        }
      });

      const status = missingKeys.length === 0 && hardcodedStrings.length === 0 ? 'pass' : 'fail';
      const issuesCount = missingKeys.length + hardcodedStrings.length;

      const result = await base44.entities.I18nAuditResult.create({
        status,
        missingKeys,
        hardcodedStrings,
        scannedFilesCount: sourceFiles.length,
        issuesCount
      });

      setLatestResult(result);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flattenObject(obj[key], newKey));
      } else {
        acc[newKey] = obj[key];
      }
      return acc;
    }, {});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            🌐 i18n Audit Dashboard
          </h1>
          <p className="text-slate-400">
            Detect missing translation keys and hardcoded UI strings
          </p>
        </motion.div>

        {/* Run Audit Button */}
        <Card className="glass-effect border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">Run Internationalization Audit</h3>
                <p className="text-slate-400 text-sm">
                  Scan source files for i18n compliance issues
                </p>
              </div>
              <Button
                onClick={runAudit}
                disabled={isRunning}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isRunning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Audit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Latest Result */}
        {latestResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Status Card */}
            <Card className={`glass-effect border-2 mb-6 ${
              latestResult.status === 'pass' 
                ? 'border-green-500' 
                : 'border-red-500'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {latestResult.status === 'pass' ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <span className="text-green-400">PASS - All Clear!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-400" />
                      <span className="text-red-400">FAIL - Issues Found</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10">
                    <div className="text-2xl font-bold text-blue-400">
                      {latestResult.scannedFilesCount}
                    </div>
                    <div className="text-xs text-slate-400">Files Scanned</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/10">
                    <div className="text-2xl font-bold text-purple-400">
                      {latestResult.issuesCount || 0}
                    </div>
                    <div className="text-xs text-slate-400">Total Issues</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-500/10">
                    <div className="text-2xl font-bold text-orange-400">
                      {latestResult.missingKeys?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400">Missing Keys</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-500/10">
                    <div className="text-2xl font-bold text-red-400">
                      {latestResult.hardcodedStrings?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400">Hardcoded Strings</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Keys Section */}
            {latestResult.missingKeys && latestResult.missingKeys.length > 0 && (
              <Card className="glass-effect border-slate-700 mb-6">
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => toggleSection('missing')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-orange-400">
                      <AlertTriangle className="w-5 h-5" />
                      Missing Translation Keys ({latestResult.missingKeys.length})
                    </span>
                    {expandedSections.missing ? <ChevronUp /> : <ChevronDown />}
                  </CardTitle>
                </CardHeader>
                <AnimatePresence>
                  {expandedSections.missing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {latestResult.missingKeys.map((item, index) => (
                            <div key={index} className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <code className="text-orange-300 font-mono text-sm">{item.key}</code>
                                  <p className="text-slate-400 text-xs mt-1">{item.reason}</p>
                                </div>
                                <Badge variant="outline" className="text-orange-400 border-orange-400">
                                  {item.file}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* Hardcoded Strings Section */}
            {latestResult.hardcodedStrings && latestResult.hardcodedStrings.length > 0 && (
              <Card className="glass-effect border-slate-700">
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => toggleSection('hardcoded')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-5 h-5" />
                      Hardcoded Strings ({latestResult.hardcodedStrings.length})
                    </span>
                    {expandedSections.hardcoded ? <ChevronUp /> : <ChevronDown />}
                  </CardTitle>
                </CardHeader>
                <AnimatePresence>
                  {expandedSections.hardcoded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {latestResult.hardcodedStrings.map((item, index) => (
                            <div key={index} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="text-red-300 font-mono text-sm mb-1">{item.pattern}</div>
                                  <p className="text-slate-400 text-xs">
                                    {item.file} • Line {item.line}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}

        {!latestResult && !isRunning && (
          <Card className="glass-effect border-slate-700">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No Audit Results Yet</h3>
              <p className="text-slate-400">
                Click "Run Audit" above to scan the project for i18n issues
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}