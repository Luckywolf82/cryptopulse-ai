import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const translations = {
  en: {
    translation: {
      "layout": {
        "title": "TradingAI",
        "subtitle": "Professional Analyzer",
        "live": "Live",
        "aiAssistant": "AI Assistant",
        "aiReady": "Ready to analyze"
      },
      "nav": {
        "dashboard": "Dashboard",
        "cryptoForex": "Crypto & Forex",
        "stocks": "Stocks 🇮🇩",
        "history": "History"
      },
      "dashboard": {
        "title": "Professional Trading Hub",
        "subtitle": "AI-Powered Analysis • Real-time Recommendations • 95%+ Accuracy",
        "aiActive": "AI Active",
        "marketLive": "Market Live",
        "stats": {
          "totalAnalysis": "Total Analysis",
          "stocks": "Stocks 🇮🇩",
          "aiAccuracy": "AI Accuracy",
          "successRate": "Success Rate",
          "idxAnalysis": "IDX analysis",
          "institutionalGrade": "Institutional grade",
          "profitable": "profitable",
          "thisWeek": "+12% this week"
        },
        "quickActions": {
          "cryptoForex": "Crypto & Forex",
          "cryptoDesc": "Technical analysis crypto and forex",
          "stocksTitle": "Indonesian Stocks 🇮🇩",
          "stocksDesc": "IDX stock analysis + fundamental news",
          "trackResults": "Track Results",
          "trackDesc": "Monitor trading performance"
        },
        "recentAnalyses": {
          "title": "Recent Analysis",
          "stock": "STOCK",
          "accuracy": "accuracy",
          "noAnalysis": "No analysis yet",
          "uploadFirst": "Upload your first chart to get started"
        },
        "insights": {
          "title": "Trading Insights",
          "riskAnalysis": "Risk Analysis",
          "aiTips": "AI Tips",
          "majority": "Majority of your analysis",
          "tip1": "💡 Use stop loss to protect your capital",
          "tip2": "📈 Take profit gradually to maximize gains",
          "tip3": "🎯 Check AI confidence score before trading"
        },
        "recommendations": {
          "title": "Smart AI Recommendations",
          "subtitle": "Today's best recommendations - All Indonesian stock price categories",
          "generate": "Generate Recommendations",
          "generateDesc": "AI will generate best recommendations based on real-time analysis",
          "affordable": "Affordable",
          "premium": "Premium",
          "stockCategories": "🇮🇩 Indonesian Stock Categories",
          "showMore": "Show More Recommendations",
          "showLess": "Show Less"
        }
      },
      "analyze": {
        "title": "Crypto & Forex Analysis",
        "subtitle": "AI-powered chart analysis with 95%+ accuracy",
        "upload": {
          "title": "Professional Chart Analyzer",
          "subtitle": "Institutional-grade AI with 95%+ accuracy",
          "description": "Drag & drop chart image or click button below. Our AI will perform institutional-grade analysis with professional trader methodology.",
          "selectImage": "Select Chart Image",
          "takeScreenshot": "Take Screenshot",
          "supportedFormats": "Supported formats:",
          "bestResults": "Best results:",
          "clearCharts": "Clear charts with visible price levels and timeframe"
        },
        "typeSelector": {
          "title": "Select Trading Type",
          "subtitle": "Choose trading type to optimize AI analysis for better accuracy",
          "spot": {
            "title": "Spot Trading",
            "description": "Spot crypto trading with direct asset ownership. Ideal for long-term investors and beginners.",
            "leverage": "Leverage: 1x (No leverage)",
            "risk": "Risk: Low-Medium",
            "ownership": "Ownership: You own the actual asset",
            "bestFor": "Best for: Long-term investment, beginners"
          },
          "forex": {
            "title": "Forex/Leverage Trading",
            "description": "Trading with high leverage for maximum profit. Suitable for experienced traders with high risk appetite.",
            "leverage": "Leverage: 5x-125x",
            "risk": "Risk: High-Very High",
            "position": "Position: CFD/Margin trading",
            "bestFor": "Best for: Day trading, scalping, experienced traders"
          },
          "aiOptimization": "🧠 AI Optimization",
          "aiOptDesc": "Trading type selection will optimize our AI analysis algorithm. Each trading type has different risk management and pattern recognition parameters to provide the most accurate analysis results according to your trading strategy."
        },
        "analyzing": {
          "title": "AI Expert Analysis",
          "subtitle": "Using expert AI for technical + fundamental analysis + latest news",
          "comprehensive": "Comprehensive stock analysis requires 15-20 seconds..."
        }
      },
      "stocks": {
        "title": "Indonesian Stock Analysis 🇮🇩",
        "subtitle": "IDX stock analysis with AI + real-time news"
      },
      "history": {
        "title": "Analysis History",
        "subtitle": "Track performance and AI analysis results",
        "stats": {
          "totalAnalysis": "Total Analysis",
          "successRate": "Success Rate",
          "profitable": "Profitable",
          "losses": "Losses"
        },
        "noAnalysis": "No Analysis Yet",
        "noAnalysisDesc": "No analysis has been performed yet. Start by analyzing your first chart.",
        "analyzeCrypto": "Analyze Crypto & Forex",
        "analyzeStocks": "Analyze Indonesian Stocks",
        "noMatch": "No Analysis Matching Filter",
        "noMatchDesc": "No analysis matches the selected filters."
      },
      "common": {
        "back": "Back",
        "refresh": "Refresh",
        "newAnalysis": "New Analysis",
        "loading": "Loading...",
        "error": "Error"
      }
    }
  },
  no: {
    translation: {
      "layout": {
        "title": "TradingAI",
        "subtitle": "Profesjonell Analysator",
        "live": "Live",
        "aiAssistant": "AI Assistent",
        "aiReady": "Klar til å analysere"
      },
      "nav": {
        "dashboard": "Dashbord",
        "cryptoForex": "Crypto & Forex",
        "stocks": "Aksjer 🇮🇩",
        "history": "Historikk"
      },
      "dashboard": {
        "title": "Profesjonell Trading Hub",
        "subtitle": "AI-drevet Analyse • Sanntidsanbefalinger • 95%+ Nøyaktighet",
        "aiActive": "AI Aktiv",
        "marketLive": "Marked Live",
        "stats": {
          "totalAnalysis": "Totalt Analyser",
          "stocks": "Aksjer 🇮🇩",
          "aiAccuracy": "AI Nøyaktighet",
          "successRate": "Suksessrate",
          "idxAnalysis": "IDX analyse",
          "institutionalGrade": "Institusjonell kvalitet",
          "profitable": "lønnsomme",
          "thisWeek": "+12% denne uken"
        },
        "quickActions": {
          "cryptoForex": "Crypto & Forex",
          "cryptoDesc": "Teknisk analyse av crypto og forex",
          "stocksTitle": "Indonesiske Aksjer 🇮🇩",
          "stocksDesc": "IDX aksjeanalyse + fundamentale nyheter",
          "trackResults": "Spor Resultater",
          "trackDesc": "Overvåk handelsresultater"
        },
        "recentAnalyses": {
          "title": "Nylige Analyser",
          "stock": "AKSJE",
          "accuracy": "nøyaktighet",
          "noAnalysis": "Ingen analyser ennå",
          "uploadFirst": "Last opp ditt første chart for å komme i gang"
        },
        "insights": {
          "title": "Trading Innsikt",
          "riskAnalysis": "Risikoanalyse",
          "aiTips": "AI Tips",
          "majority": "Majoriteten av dine analyser",
          "tip1": "💡 Bruk stop loss for å beskytte kapitalen din",
          "tip2": "📈 Ta profitt gradvis for å maksimere gevinst",
          "tip3": "🎯 Sjekk AI tillitscore før handel"
        },
        "recommendations": {
          "title": "Smarte AI Anbefalinger",
          "subtitle": "Dagens beste anbefalinger - Alle indonesiske aksjepris-kategorier",
          "generate": "Generer Anbefalinger",
          "generateDesc": "AI vil generere beste anbefalinger basert på sanntidsanalyse",
          "affordable": "Rimelig",
          "premium": "Premium",
          "stockCategories": "🇮🇩 Indonesiske Aksje-kategorier",
          "showMore": "Vis Flere Anbefalinger",
          "showLess": "Vis Færre"
        }
      },
      "analyze": {
        "title": "Crypto & Forex Analyse",
        "subtitle": "AI-drevet chart-analyse med 95%+ nøyaktighet",
        "upload": {
          "title": "Profesjonell Chart Analysator",
          "subtitle": "Institusjonell AI med 95%+ nøyaktighet",
          "description": "Dra og slipp chart-bilde eller klikk knappen under. Vår AI vil utføre analyse på institusjonelt nivå med profesjonell trader-metodikk.",
          "selectImage": "Velg Chart Bilde",
          "takeScreenshot": "Ta Skjermbilde",
          "supportedFormats": "Støttede formater:",
          "bestResults": "Beste resultater:",
          "clearCharts": "Tydelige charts med synlige prisnivåer og tidsramme"
        },
        "typeSelector": {
          "title": "Velg Trading Type",
          "subtitle": "Velg trading type for å optimalisere AI-analysen for bedre nøyaktighet",
          "spot": {
            "title": "Spot Trading",
            "description": "Spot crypto trading med direkte eierskap til eiendeler. Ideelt for langsiktige investorer og nybegynnere.",
            "leverage": "Leverage: 1x (Ingen leverage)",
            "risk": "Risiko: Lav-Middels",
            "ownership": "Eierskap: Du eier den faktiske eiendelen",
            "bestFor": "Best for: Langsiktig investering, nybegynnere"
          },
          "forex": {
            "title": "Forex/Leverage Trading",
            "description": "Trading med høy leverage for maksimal profitt. Passer for erfarne tradere med høy risikoappetitt.",
            "leverage": "Leverage: 5x-125x",
            "risk": "Risiko: Høy-Veldig Høy",
            "position": "Posisjon: CFD/Margin trading",
            "bestFor": "Best for: Dagshandel, scalping, erfarne tradere"
          },
          "aiOptimization": "🧠 AI Optimalisering",
          "aiOptDesc": "Valg av trading type vil optimalisere vår AI-analyse-algoritme. Hver trading type har forskjellige risikostyring og mønstergjenkjennings-parametere for å gi de mest nøyaktige analyseresultatene i henhold til din trading-strategi."
        },
        "analyzing": {
          "title": "AI Ekspert Analyse",
          "subtitle": "Bruker ekspert AI for teknisk + fundamental analyse + siste nyheter",
          "comprehensive": "Omfattende aksjeanalyse krever 15-20 sekunder..."
        }
      },
      "stocks": {
        "title": "Indonesisk Aksjeanalyse 🇮🇩",
        "subtitle": "IDX aksjeanalyse med AI + sanntidsnyheter"
      },
      "history": {
        "title": "Analyse Historikk",
        "subtitle": "Spor ytelse og AI-analyseresultater",
        "stats": {
          "totalAnalysis": "Totalt Analyser",
          "successRate": "Suksessrate",
          "profitable": "Lønnsomme",
          "losses": "Tap"
        },
        "noAnalysis": "Ingen Analyser Ennå",
        "noAnalysisDesc": "Ingen analyser har blitt utført ennå. Start med å analysere ditt første chart.",
        "analyzeCrypto": "Analyser Crypto & Forex",
        "analyzeStocks": "Analyser Indonesiske Aksjer",
        "noMatch": "Ingen Analyser Matcher Filter",
        "noMatchDesc": "Ingen analyser matcher de valgte filtrene."
      },
      "common": {
        "back": "Tilbake",
        "refresh": "Oppdater",
        "newAnalysis": "Ny Analyse",
        "loading": "Laster...",
        "error": "Feil"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;