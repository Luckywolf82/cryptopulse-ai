import React, { useState } from "react";
import { TradeResult } from "@/entities/TradeResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle, Clock, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TradeResultTracker({ analysis, tradeResult, onUpdate }) {
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
            Hasil Trading Tercatat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className={`font-bold ${
              tradeResult.result_status === 'SUCCESS' ? 'text-green-400' : 
              tradeResult.result_status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
            }`}>{tradeResult.result_status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Profit/Loss:</span>
            <span className={`font-bold ${
              tradeResult.profit_loss_percent > 0 ? 'text-green-400' : 'text-red-400'
            }`}>{tradeResult.profit_loss_percent?.toFixed(2) || 0}%</span>
          </div>
           <div className="flex justify-between">
            <span className="text-slate-400">Holding Period:</span>
            <span className="text-white">{tradeResult.holding_period_days || 0} hari</span>
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
             Lacak Hasil Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
            <Button onClick={() => setIsEditing(true)} className="w-full">
                <Edit className="w-4 h-4 mr-2" /> Lacak Hasil Trading
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Input Hasil Trading</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">Profit / Loss (%)</label>
          <Input 
            type="number"
            value={formData.profit_loss_percent}
            onChange={(e) => setFormData({...formData, profit_loss_percent: parseFloat(e.target.value)})}
            placeholder="Contoh: 15.5 atau -5"
            className="bg-slate-800 border-slate-600"
          />
        </div>
         <div>
          <label className="text-sm text-slate-400">Periode Holding (hari)</label>
          <Input 
            type="number"
            value={formData.holding_period_days}
            onChange={(e) => setFormData({...formData, holding_period_days: parseInt(e.target.value, 10)})}
            placeholder="Berapa hari trade di-hold?"
            className="bg-slate-800 border-slate-600"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Catatan (Opsional)</label>
          <Input 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Contoh: Exit lebih awal karena berita"
            className="bg-slate-800 border-slate-600"
          />
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => handleLogResult('SUCCESS')}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <ThumbsUp className="w-4 h-4 mr-2" /> Sukses (TP)
          </Button>
          <Button
            onClick={() => handleLogResult('FAILED')}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <ThumbsDown className="w-4 h-4 mr-2" /> Gagal (SL)
          </Button>
        </div>
         <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full">Batal</Button>
      </CardContent>
    </Card>
  );
}