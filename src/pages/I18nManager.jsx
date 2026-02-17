import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Languages, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import translations from "@/components/lib/i18n";

export default function I18nManagerPage() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkCompleteness = async () => {
    setChecking(true);
    try {
      // Get current translations
      const i18nData = {
        en: translations.options.resources.en,
        no: translations.options.resources.no,
        id: translations.options.resources.id
      };

      const response = await base44.functions.invoke('ensureI18nCompleteness', { i18nData });
      setResult(response.data);
      
      if (response.data.status === 'complete') {
        toast.success('All translations are complete!');
      } else {
        toast.warning(`Missing ${response.data.summary.missingInNorwegian + response.data.summary.missingInIndonesian} translations`);
      }
    } catch (error) {
      console.error('Check failed:', error);
      toast.error('Failed to check translations');
    }
    setChecking(false);
  };

  const copySuggestion = (lang, text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyAllSuggestions = (lang) => {
    if (!result?.suggestions?.[lang]) return;
    
    const formatted = JSON.stringify(result.suggestions[lang], null, 2);
    navigator.clipboard.writeText(formatted);
    toast.success(`All ${lang.toUpperCase()} suggestions copied!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Languages className="w-10 h-10 text-blue-400" />
              <h1 className="text-4xl font-bold text-white">i18n Manager</h1>
            </div>
            <p className="text-slate-300">Ensure all translations are complete across languages</p>
          </div>
          <Button
            onClick={checkCompleteness}
            disabled={checking}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Check Completeness
          </Button>
        </div>

        {/* Summary */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Keys</p>
                    <p className="text-3xl font-bold text-white">{result.summary.totalEnglishKeys}</p>
                  </div>
                  <Languages className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Missing (Norwegian)</p>
                    <p className="text-3xl font-bold text-orange-400">{result.summary.missingInNorwegian}</p>
                  </div>
                  {result.summary.missingInNorwegian === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Missing (Indonesian)</p>
                    <p className="text-3xl font-bold text-orange-400">{result.summary.missingInIndonesian}</p>
                  </div>
                  {result.summary.missingInIndonesian === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status */}
        {result && result.status === 'complete' && (
          <Card className="bg-green-500/10 border-green-500/50 mb-8">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">All translations complete!</h3>
                  <p className="text-green-300 text-sm">All languages have complete translations.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Keys & Suggestions */}
        {result && result.status === 'incomplete' && (
          <div className="space-y-6">
            {['no', 'id'].map(lang => {
              const missing = result.missingKeys?.[lang];
              const suggestions = result.suggestions?.[lang];
              
              if (!missing || missing.length === 0) return null;

              return (
                <Card key={lang} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-white">
                          {lang === 'no' ? '🇳🇴 Norwegian' : '🇮🇩 Indonesian'} - Missing {missing.length} translations
                        </CardTitle>
                        <Badge className="bg-orange-500/20 text-orange-400">
                          Incomplete
                        </Badge>
                      </div>
                      {suggestions && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAllSuggestions(lang)}
                          className="border-slate-600"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {suggestions ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400 mb-4">
                          AI-generated suggestions (review before using):
                        </p>
                        {missing.map(key => (
                          <div key={key} className="bg-slate-900/50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-xs font-mono text-blue-400 mb-1">{key}</p>
                                <p className="text-white">{suggestions[key] || 'No suggestion'}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copySuggestion(lang, suggestions[key] || '')}
                                className="flex-shrink-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {missing.map(key => (
                          <div key={key} className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-sm font-mono text-blue-400">{key}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Extra Keys Warning */}
        {result && result.extraKeys && Object.keys(result.extraKeys).length > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/50 mt-8">
            <CardHeader>
              <CardTitle className="text-yellow-400">⚠️ Extra Keys Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-300 text-sm mb-4">
                These keys exist in translations but not in English (may be unused):
              </p>
              {Object.entries(result.extraKeys).map(([lang, keys]) => (
                <div key={lang} className="mb-4">
                  <h4 className="text-white font-semibold mb-2">
                    {lang === 'no' ? 'Norwegian' : 'Indonesian'}:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keys.map(key => (
                      <Badge key={key} variant="outline" className="border-yellow-500/50 text-yellow-400">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!result && !checking && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Languages className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Click "Check Completeness" to scan translations</p>
              <p className="text-slate-500 text-sm mt-2">
                This will identify missing translations and generate AI suggestions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}