import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfDay, subDays } from "date-fns";
import { useTranslation } from "react-i18next";

export default function SignalFrequencyChart({ signals }) {
  const { t } = useTranslation();
  const chartData = useMemo(() => {
    // Group signals by day for the last 30 days
    const days = 30;
    const today = startOfDay(new Date());
    const dataMap = new Map();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = startOfDay(subDays(today, i));
      const dateStr = format(date, 'yyyy-MM-dd');
      dataMap.set(dateStr, {
        date: dateStr,
        dateDisplay: format(date, 'dd MMM'),
        total: 0,
        long: 0,
        short: 0,
        highQuality: 0
      });
    }

    // Count signals per day
    signals.forEach(signal => {
      const date = startOfDay(parseISO(signal.created_date));
      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (dataMap.has(dateStr)) {
        const dayData = dataMap.get(dateStr);
        dayData.total++;
        if (signal.direction === 'long') dayData.long++;
        if (signal.direction === 'short') dayData.short++;
        if (signal.score >= 70) dayData.highQuality++;
      }
    });

    // Convert to array and sort by date
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [signals]);

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">{t('analytics.frequencyLast30')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="dateDisplay" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              name={t('analytics.total')}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="long" 
              stroke="#10b981" 
              name={t('analytics.long')}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="short" 
              stroke="#ef4444" 
              name={t('analytics.short')}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="highQuality" 
              stroke="#a855f7" 
              name={t('analytics.highQuality70')}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}