import React, { useState } from "react";
import { TradeResult } from "@/entities/TradeResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle, Clock, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

export default function TradeResultTracker({ analysis, tradeResult, onUpdate }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    profit_loss_percent: 0,
    holding_period_days: 0,
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogResult = async (status) => {
    setIsLoading(true);
    const data = {
      analysis_id: analysis.id,
      asset_symbol: analysis.stock_code || analysis.crypto_pair,
      result_status: status,
      recommendation_action: analysis.investment_recommendation?.action || analysis.trading_direction,
      entry_price: analysis.current_price || analysis.entry_price,
      ...formData
    };

    try {
      await TradeResult.create(data);
      onUpdate(); // Refresh parent component
    } catch (error) {
      console.error("Failed to log trade result:", error);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  if (tradeResult) {
    return (
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {tradeResult.result_status === 'SUCCESS' && <CheckCircle className="text-green-400" />}
            {tradeResult.result_status === 'FAILED' && <XCircle className="text-red-400" />}
            {tradeResult.result_status === 'ONGOING' && <Clock className="text-yellow-400" />}
            {t('investment.tradeResultRecorded')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">{t('investment.status')}:</span>
            <span className={`font-bold ${
              tradeResult.result_status === 'SUCCESS' ? 'text-green-400' : 
              tradeResult.result_status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
            }`}>{tradeResult.result_status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('investment.profitLoss')}:</span>
            <span className={`font-bold ${
              tradeResult.profit_loss_percent > 0 ? 'text-green-400' : 'text-red-400'
            }`}>{tradeResult.profit_loss_percent?.toFixed(2) || 0}%</span>
          </div>
           <div className="flex justify-between">
            <span className="text-slate-400">{t('investment.holdingPeriod')}:</span>
            <span className="text-white">{tradeResult.holding_period_days || 0} {t('investment.days')}</span>
          </div>
          {tradeResult.notes && (
            <div className="pt-2 border-t border-slate-700">
              <p className="text-slate-400 text-xs italic">"{tradeResult.notes}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isEditing) {
    return (
       <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
             {t('investment.trackTradeResult')}
          </CardTitle>
        </CardHeader>
        <CardContent>
            <Button onClick={() => setIsEditing(true)} className="w-full">
                <Edit className="w-4 h-4 mr-2" /> {t('investment.trackTradeResult')}
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">{t('investment.inputTradeResult')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">{t('investment.profitLossPercent')}</label>
          <Input 
            type="number"
            value={formData.profit_loss_percent}
            onChange={(e) => setFormData({...formData, profit_loss_percent: parseFloat(e.target.value)})}
            placeholder={t('investment.profitLossPlaceholder')}
            className="bg-slate-800 border-slate-600"
          />
        </div>
         <div>
          <label className="text-sm text-slate-400">{t('investment.holdingPeriodDays')}</label>
          <Input 
            type="number"
            value={formData.holding_period_days}
            onChange={(e) => setFormData({...formData, holding_period_days: parseInt(e.target.value, 10)})}
            placeholder={t('investment.holdingPeriodPlaceholder')}
            className="bg-slate-800 border-slate-600"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">{t('investment.notesOptional')}</label>
          <Input 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder={t('investment.notesPlaceholder')}
            className="bg-slate-800 border-slate-600"
          />
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => handleLogResult('SUCCESS')}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <ThumbsUp className="w-4 h-4 mr-2" /> {t('investment.successTP')}
          </Button>
          <Button
            onClick={() => handleLogResult('FAILED')}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <ThumbsDown className="w-4 h-4 mr-2" /> {t('investment.failedSL')}
          </Button>
        </div>
         <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full">{t('common.cancel')}</Button>
      </CardContent>
    </Card>
  );
}