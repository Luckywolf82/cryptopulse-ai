import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HistoryFilters({ filters, onFiltersChange }) {
  const { t } = useTranslation();
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="glass-effect border-slate-700">
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-wrap gap-2 md:gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300 hidden md:block">Filter:</span>
          </div>

          <Select
            value={filters.tradingType}
            onValueChange={(value) => handleFilterChange('tradingType', value)}
          >
            <SelectTrigger className="w-24 md:w-32 border-slate-600 bg-slate-800/50 text-xs md:text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.filters.all')}</SelectItem>
              <SelectItem value="stock">{t('history.filters.stock')}</SelectItem>
              <SelectItem value="spot">{t('history.filters.spot')}</SelectItem>
              <SelectItem value="forex">{t('history.filters.forex')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.riskLevel}
            onValueChange={(value) => handleFilterChange('riskLevel', value)}
          >
            <SelectTrigger className="w-24 md:w-32 border-slate-600 bg-slate-800/50 text-xs md:text-sm">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.filters.risk')}</SelectItem>
              <SelectItem value="low">{t('history.filters.low')}</SelectItem>
              <SelectItem value="medium">{t('history.filters.medium')}</SelectItem>
              <SelectItem value="high">{t('history.filters.high')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.resultStatus}
            onValueChange={(value) => handleFilterChange('resultStatus', value)}
          >
            <SelectTrigger className="w-24 md:w-32 border-slate-600 bg-slate-800/50 text-xs md:text-sm">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.filters.all')}</SelectItem>
              <SelectItem value="tracked">{t('history.filters.tracked')}</SelectItem>
              <SelectItem value="untracked">{t('history.filters.untracked')}</SelectItem>
              <SelectItem value="SUCCESS">{t('history.filters.success')}</SelectItem>
              <SelectItem value="FAILED">{t('history.filters.failed')}</SelectItem>
              <SelectItem value="ONGOING">{t('history.filters.ongoing')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.dateRange}
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger className="w-24 md:w-32 border-slate-600 bg-slate-800/50 text-xs md:text-sm">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.filters.all')}</SelectItem>
              <SelectItem value="today">{t('history.filters.today')}</SelectItem>
              <SelectItem value="week">{t('history.filters.week')}</SelectItem>
              <SelectItem value="month">{t('history.filters.month')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}