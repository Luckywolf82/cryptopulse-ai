import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DCACalculator({ recommendation }) {
  const { t } = useTranslation();
  const [monthlyAmount, setMonthlyAmount] = useState(1000000);
  const [duration, setDuration] = useState(12);
  
  const currentPrice = recommendation.current_price || 0;
  const targetPrice = recommendation.target_price || 0;
  const expectedReturn = recommendation.expected_return_percent || 0;
  
  const totalInvestment = monthlyAmount * duration;
  const sharesPerMonth = Math.floor(monthlyAmount / currentPrice);
  const totalShares = sharesPerMonth * duration;
  const avgPrice = totalInvestment / totalShares;
  const projectedValue = totalShares * targetPrice;
  const projectedProfit = projectedValue - totalInvestment;
  const projectedReturnPercent = ((projectedValue - totalInvestment) / totalInvestment) * 100;

  return (
    <Card className="glass-effect border-slate-700">
      <CardContent className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">
                {t('investment.monthlyInstallment')}
              </label>
              <Input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="bg-slate-800/50 border-slate-600"
                placeholder="1000000"
              />
            </div>
            
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">
                {t('investment.duration')}: {duration} {t('investment.months')}
              </label>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                max={60}
                min={3}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Calculation Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <div className="text-slate-400 text-xs mb-1">{t('investment.totalInvestment')}</div>
              <div className="text-sm md:text-base font-bold text-blue-400">
                Rp {totalInvestment.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-purple-500/10">
              <div className="text-slate-400 text-xs mb-1">{t('investment.totalShares')}</div>
              <div className="text-sm md:text-base font-bold text-purple-400">
                {totalShares.toLocaleString('id-ID')} {t('investment.lot')}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
              <div className="text-slate-400 text-xs mb-1">{t('investment.projectedValue')}</div>
              <div className="text-sm md:text-base font-bold text-emerald-400">
                Rp {projectedValue.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-slate-400 text-xs mb-1">{t('investment.projectedProfit')}</div>
              <div className="text-sm md:text-base font-bold text-green-400">
                +{projectedReturnPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">
                Rp {projectedProfit.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* DCA Strategy Explanation */}
          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {t('investment.dcaStrategy')}
            </h4>
            <div className="text-sm text-slate-300 space-y-2">
              <p>• {t('investment.buyPlan', { shares: sharesPerMonth, months: duration })}</p>
              <p>• {t('investment.averagePrice')}: Rp {avgPrice.toLocaleString('id-ID')}</p>
              <p>• {t('investment.reducesRisk')}</p>
              <p>• {t('investment.suitableFor')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}