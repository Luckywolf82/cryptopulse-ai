import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, BarChart3, History, Building2 } from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
  },
  {
    title: "Crypto & Forex",
    url: createPageUrl("Analyze"),
    icon: TrendingUp,
  },
  {
    title: "Saham 🇮🇩",
    url: createPageUrl("StockAnalysis"),
    icon: Building2,
  },
  {
    title: "Riwayat",
    url: createPageUrl("History"),
    icon: History,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <style>
        {`
          :root {
            --background: 0 0% 3.9%;
            --foreground: 0 0% 98%;
            --card: 0 0% 5.9%;
            --card-foreground: 0 0% 98%;
            --popover: 0 0% 5.9%;
            --popover-foreground: 0 0% 98%;
            --primary: 142.1 76.2% 36.3%;
            --primary-foreground: 355.7 100% 97.3%;
            --secondary: 240 3.7% 15.9%;
            --secondary-foreground: 0 0% 98%;
            --muted: 240 3.7% 15.9%;
            --muted-foreground: 240 5% 64.9%;
            --accent: 240 3.7% 15.9%;
            --accent-foreground: 0 0% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 0 0% 98%;
            --border: 240 3.7% 15.9%;
            --input: 240 3.7% 15.9%;
            --ring: 142.4 71.8% 29.2%;
          }
          
          body {
            background: linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #1f2937 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          .glass-effect {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          /* Mobile-First Design */
          @media (max-width: 768px) {
            .mobile-content {
              padding-bottom: 100px; /* Space for bottom navigation */
            }
          }
        `}
      </style>

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">TradingAI</h1>
              <p className="text-xs text-slate-400">Professional Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-300">Live</span>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 z-40">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">TradingAI</h2>
              <p className="text-xs text-slate-400">Professional Analyzer</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                location.pathname === item.url 
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">AI Assistant</p>
              <p className="text-xs text-slate-400">Ready to analyze</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <main className="mobile-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 z-50">
        <nav className="flex justify-around items-center py-2">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                location.pathname === item.url 
                  ? 'text-emerald-400' 
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.title.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}