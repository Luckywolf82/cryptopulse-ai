
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function HistoryFilters({ filters, onFiltersChange }) {
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
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="stock">Saham</SelectItem>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
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
              <SelectItem value="all">Risk</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
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
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="tracked">Tracked</SelectItem>
              <SelectItem value="untracked">Untracked</SelectItem>
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
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu</SelectItem>
              <SelectItem value="month">Bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
