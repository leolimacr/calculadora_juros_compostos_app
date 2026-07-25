import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronUp } from 'lucide-react';
import { FPI_COPY } from '../../../../theme/fpiVoiceGuide';

interface AveragesAnalysisPanelProps {
  userUid: string | undefined;
  isReady: boolean;
  safeTransactions: any[];
  isPrivacyMode: boolean;
  hasHistoryAccess: boolean;
  onHistoryBlocked: () => void;
}

const AveragesAnalysisPanel: React.FC<AveragesAnalysisPanelProps> = ({
  userUid,
  isReady,
  safeTransactions,
  isPrivacyMode,
  hasHistoryAccess,
  onHistoryBlocked,
}) => {
  const [showAverages, setShowAverages] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [yearlyHistory, setYearlyHistory] = useState<any[]>([]);

  const [averagesWindow, setAveragesWindow] = useState<'year' | 'last3' | 'last6' | 'all' | 'custom'>('year');
  const [customPeriodStart, setCustomPeriodStart] = useState('');
  const [customPeriodEnd, setCustomPeriodEnd] = useState('');
  const [averageMode, setAverageMode] = useState<'real' | 'occurrence'>('real');
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState(false);
  const [includeCurrentMonthTotal, setIncludeCurrentMonthTotal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);

  // CARGA HISTÓRICA SOB DEMANDA PARA MÉDIAS (CUSTO OTIMIZADO)
  useEffect(() => {
    if (showAverages && userUid && isReady && hasHistoryAccess) {
      const loadYearlyData = async () => {
        setIsHistoryLoading(true);
        setYearlyHistory([]);
        try {
          const startOfYear = `${selectedYear}-01-01`;
          const endOfYear = `${selectedYear}-12-31`;
          
          const { ref, get, query, orderByChild, startAt, endAt } = await import('firebase/database');
          const { db } = await import('../../../../firebase');
          
          const txRef = ref(db, `transactions/${userUid}`);
          const q = query(txRef, orderByChild('date'), startAt(startOfYear), endAt(endOfYear));
          
          const snapshot = await get(q);
          if (snapshot.exists()) {
            const data: any[] = [];
            snapshot.forEach((child) => {
              data.push({ id: child.key, ...child.val() });
            });
            data.sort((a, b) => b.date.localeCompare(a.date));
            setYearlyHistory(data);
          }
        } catch (error) {
          console.error("Erro ao carregar histórico anual:", error);
        } finally {
          setIsHistoryLoading(false);
        }
      };
      loadYearlyData();
    }
  }, [showAverages, userUid, isReady, hasHistoryAccess, selectedYear]);

  const averagesData = useMemo(() => {
    if (!showAverages || !isReady) return [];

    // Mesclar transações em tempo real com o histórico carregado sob demanda
    const txMap = new Map();
    yearlyHistory.forEach(t => txMap.set(t.id, t));
    safeTransactions.forEach(t => txMap.set(t.id, t));
    
    const allRelevantTx = Array.from(txMap.values());

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
    const isMonthClosed = (year: number, month: number) =>
      year < currentYear || (year === currentYear && month < currentMonth);
    const isCurrentMonth = (year: number, month: number) =>
      year === currentYear && month === currentMonth;

    const getWindowMonths = (): { year: number; month: number }[] => {
      const months: { year: number; month: number }[] = [];
      if (averagesWindow === 'year') {
        for (let m = 1; m <= 12; m++) months.push({ year: currentYear, month: m });
      } else if (averagesWindow === 'last3') {
        for (let i = 2; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }
      } else if (averagesWindow === 'last6') {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }
      } else if (averagesWindow === 'custom' && customPeriodStart && customPeriodEnd) {
        const [startYear, startMonth] = customPeriodStart.split('-').map(Number);
        const [endYear, endMonth] = customPeriodEnd.split('-').map(Number);
        let y = startYear; let m = startMonth;
        while (y < endYear || (y === endYear && m <= endMonth)) {
          months.push({ year: y, month: m });
          m++; if (m > 12) { m = 1; y++; }
        }
      } else {
        const set = new Set<string>();
        allRelevantTx.forEach((t: any) => {
          if (t?.date) {
            const [y, m] = t.date.split('-').map(Number);
            set.add(`${y}-${String(m).padStart(2, '0')}`);
          }
        });
        Array.from(set).sort().forEach(key => {
          const [y, m] = key.split('-').map(Number);
          months.push({ year: y, month: m });
        });
      }
      return months;
    };

    const windowMonths = getWindowMonths();
    const categoryMonthMap = new Map<string, Map<string, number>>();

    allRelevantTx
      .filter((t: any) => t?.type === 'expense' && t?.date)
      .forEach((t: any) => {
        const [y, m] = t.date.split('-').map(Number);
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;
        const cat = (t.category || 'Sem categoria').toString();
        const val = Number(t.amount) || 0;
        if (!categoryMonthMap.has(cat)) categoryMonthMap.set(cat, new Map());
        const mm = categoryMonthMap.get(cat)!;
        mm.set(monthKey, (mm.get(monthKey) || 0) + val);
      });

    // --- TOTAL GERAL (YTD: ano corrente, jan-dez) ---
    const ytdMonths: { year: number; month: number }[] = [];
    for (let m = 1; m <= 12; m++) ytdMonths.push({ year: selectedYear, month: m });

    const totalMonthMap = new Map<string, number>();
    categoryMonthMap.forEach((cm) => {
      cm.forEach((value, key) => {
        totalMonthMap.set(key, (totalMonthMap.get(key) || 0) + value);
      });
    });

    const totalMonthsData = ytdMonths.map(({ year, month }) => {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const value = totalMonthMap.get(monthKey) || 0;
      const closed = isMonthClosed(year, month);
      const current = isCurrentMonth(year, month);
      let projection: number | null = null;
      if (current && value > 0) {
        const dayOfMonth = today.getDate();
        const totalDays = daysInMonth(year, month);
        projection = (value / dayOfMonth) * totalDays;
      }
      const label = new Date(year, month - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        .replace('.', '');
      return { year, month, label, value, isClosed: closed, isCurrentMonth: current, deviation: null as number | null, projection };
    });

    const totalMonthsForAverage = totalMonthsData.filter(m => {
      if (m.isClosed && m.value > 0) return true;
      if (m.isCurrentMonth && includeCurrentMonthTotal && m.value > 0) return true;
      return false;
    });
    const totalClosedInYTD = ytdMonths.filter(({ year, month }) =>
      isMonthClosed(year, month) || (isCurrentMonth(year, month) && includeCurrentMonthTotal)
    ).length;
    const totalYTDCumulative = totalMonthsForAverage.reduce((sum, m) => sum + m.value, 0);
    const ytdAverageReal = totalClosedInYTD > 0 ? totalYTDCumulative / totalClosedInYTD : 0;
    const ytdAverageOccurrence = totalMonthsForAverage.length > 0 ? totalYTDCumulative / totalMonthsForAverage.length : 0;
    const ytdActiveAvg = averageMode === 'real' ? ytdAverageReal : ytdAverageOccurrence;

    const totalWithDeviation = totalMonthsData.map(m => ({
      ...m,
      deviation: (m.isClosed || (m.isCurrentMonth && includeCurrentMonthTotal)) && m.value > 0 && ytdActiveAvg > 0
        ? ((m.value - ytdActiveAvg) / ytdActiveAvg) * 100
        : null,
    }));

    const projectedYear = ytdAverageReal * 12;

    let trend: { direction: 'up' | 'down' | 'stable'; percentage: number } | null = null;
    const closedSorted = totalWithDeviation.filter(m => m.isClosed && m.value > 0);
    if (closedSorted.length >= 6) {
      const last3 = closedSorted.slice(-3);
      const prev3 = closedSorted.slice(-6, -3);
      const l3Avg = last3.reduce((s, m) => s + m.value, 0) / 3;
      const p3Avg = prev3.reduce((s, m) => s + m.value, 0) / 3;
      if (p3Avg > 0) {
        const pct = ((l3Avg - p3Avg) / p3Avg) * 100;
        trend = { direction: pct > 5 ? 'up' : pct < -5 ? 'down' : 'stable', percentage: Math.abs(pct) };
      }
    }

    const monthsWithVal = totalWithDeviation.filter(m => m.value > 0);
    const highestMonth = monthsWithVal.reduce((b, m) => (m.value > b.value ? m : b), monthsWithVal[0] || null);
    const lowestMonth = monthsWithVal.reduce((b, m) => (m.value < b.value ? m : b), monthsWithVal[0] || null);

    const totalEntry = {
      category: 'Total Geral',
      average: ytdAverageReal,
      averageOccurrence: ytdAverageOccurrence,
      totalValue: totalYTDCumulative,
      totalMonthsInWindow: totalClosedInYTD,
      monthsWithValue: totalMonthsForAverage.length,
      months: totalWithDeviation,
      projectedYearTotal: projectedYear,
      trend,
      highestMonth: highestMonth ? { label: highestMonth.label, value: highestMonth.value } : null,
      lowestMonth: lowestMonth ? { label: lowestMonth.label, value: lowestMonth.value } : null,
    };

    type AveragesDataEntry = {
      category: string;
      average: number;
      averageOccurrence: number;
      totalValue: number;
      totalMonthsInWindow: number;
      monthsWithValue: number;
      months: {
        year: number; month: number; label: string; value: number;
        isClosed: boolean; isCurrentMonth: boolean;
        deviation: number | null; projection: number | null;
      }[];
      projectedYearTotal?: number;
      trend?: { direction: 'up' | 'down' | 'stable'; percentage: number } | null;
      highestMonth?: { label: string; value: number } | null;
      lowestMonth?: { label: string; value: number } | null;
    };
    const result: AveragesDataEntry[] = [];

    categoryMonthMap.forEach((monthMap, category) => {
      const monthsData = windowMonths.map(({ year, month }) => {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const value = monthMap.get(monthKey) || 0;
        const closed = isMonthClosed(year, month);
        const current = isCurrentMonth(year, month);
        let projection: number | null = null;
        if (current && value > 0) {
          const dayOfMonth = today.getDate();
          const totalDays = daysInMonth(year, month);
          projection = (value / dayOfMonth) * totalDays;
        }
        const label = new Date(year, month - 1, 1)
          .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          .replace('.', '');
        return { year, month, label, value, isClosed: closed, isCurrentMonth: current, deviation: null as number | null, projection };
      });

      const monthsForAverage = monthsData.filter(m => {
        if (m.isClosed && m.value > 0) return true;
      if (m.isCurrentMonth && includeCurrentMonth && m.value > 0) return true;
        return false;
      });
      if (monthsForAverage.length === 0) return;

      const totalValue = monthsForAverage.reduce((sum, m) => sum + m.value, 0);

      const totalClosedMonthsInWindow = windowMonths.filter(({ year, month }) =>
      isMonthClosed(year, month) || (isCurrentMonth(year, month) && includeCurrentMonth)
      ).length;

      const averageReal = totalClosedMonthsInWindow > 0 ? totalValue / totalClosedMonthsInWindow : 0;
      const averageOccurrence = totalValue / monthsForAverage.length;

      const activeAverage = averageMode === 'real' ? averageReal : averageOccurrence;

      const withDeviation = monthsData.map(m => ({
        ...m,
        deviation: (m.isClosed || (m.isCurrentMonth && includeCurrentMonth)) && m.value > 0 && activeAverage > 0
          ? ((m.value - activeAverage) / activeAverage) * 100
          : null,
      }));

      result.push({
        category,
        average: averageReal,
        averageOccurrence,
        totalValue,
        totalMonthsInWindow: totalClosedMonthsInWindow,
        monthsWithValue: monthsForAverage.length,
        months: withDeviation,
      });
    });

    const sortedCategories = result.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR', { sensitivity: 'base' }));
    return [totalEntry, ...sortedCategories];
  }, [safeTransactions, yearlyHistory, averagesWindow, includeCurrentMonth, includeCurrentMonthTotal, averageMode, customPeriodStart, customPeriodEnd, isReady, showAverages, selectedYear]);

  return (
    <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-text-primary font-black text-xxs uppercase tracking-ultra-wide flex items-center gap-2">
            Análise de Médias
            {!hasHistoryAccess && (
              <span className="text-[8px] px-1.5 py-0.5 bg-brand-secondary/10 text-brand-secondary rounded-full font-bold tracking-normal normal-case">
                Histórico multi-mês no Pro
              </span>
            )}
          </h3>
          <p className="text-text-muted text-xxs font-bold uppercase tracking-ultra-wide mt-1">
            Média de gastos por categoria · apenas despesas
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!hasHistoryAccess) {
              onHistoryBlocked();
              return;
            }
            setShowAverages((prev) => !prev);
          }}
          className={`px-4 py-2.5 rounded-2xl text-xxs font-black uppercase border transition-all ${
            showAverages
              ? 'bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary'
              : 'bg-status-info/10 border-brand-secondary/30 text-brand-secondary hover:bg-status-info/20'
          }`}
        >
          {showAverages ? 'Ocultar Análise' : 'Mostrar Análise de Médias'}
        </button>
      </div>

      {showAverages && (
        <>
          {isHistoryLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 animate-in fade-in duration-300">
              <RefreshCw size={24} className="text-brand-secondary animate-spin" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-ultra-wide">
                Sincronizando histórico anual...
              </p>
            </div>
          )}

          {!isHistoryLoading && (
            <>
              {/* VISÃO GERAL — GASTOS TOTAIS DO ANO */}
              {averagesData.some(a => a.totalValue > 0) && averagesData[0].category === 'Total Geral' && (() => {
                const te = averagesData[0];
                const ytdActiveAvg = averageMode === 'real' ? te.average : te.averageOccurrence;
                return (
                  <div className="mt-5 p-4 bg-surface-secondary border border-surface-elevated rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[9px] px-2 py-1 bg-brand-secondary/15 text-brand-secondary rounded-full font-black uppercase tracking-ultra-wide">GERAL</span>
                      <span className="text-xxs font-black text-text-primary uppercase tracking-ultra-wide">Visão Geral · {selectedYear}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedYear(y => y - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-all text-xxs font-black"
                        >
                          ◀
                        </button>
                        <span className="text-xxs font-black text-text-secondary px-1">{selectedYear}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedYear(y => Math.min(y + 1, new Date().getFullYear()))}
                          disabled={selectedYear >= new Date().getFullYear()}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-all text-xxs font-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▶
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      <div className="bg-surface-elevated rounded-2xl p-3">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-ultra-wide">Total acumulado</p>
                        <p className="text-sm font-black text-text-primary mt-0.5">
                          {isPrivacyMode ? '••••' : `R$ ${te.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </p>
                        {te.totalMonthsInWindow > 0 && (
                          <p className="text-[9px] font-bold text-text-muted mt-0.5">
                            {te.totalMonthsInWindow} {te.totalMonthsInWindow === 1 ? 'mês fechado' : 'meses fechados'}
                          </p>
                        )}
                      </div>
                      <div className="bg-surface-elevated rounded-2xl p-3">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-ultra-wide">Média mensal</p>
                        <p className="text-sm font-black text-brand-secondary mt-0.5">
                          {isPrivacyMode ? '••••' : `R$ ${ytdActiveAvg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </p>
                      </div>
                      <div className="bg-surface-elevated rounded-2xl p-3">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-ultra-wide">Projeção anual</p>
                        <p className="text-sm font-black mt-0.5" style={{ color: '#f59e0b' }}>
                          {isPrivacyMode ? '••••' : `R$ ${(te.projectedYearTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </p>
                      </div>
                      <div className="bg-surface-elevated rounded-2xl p-3">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-ultra-wide flex items-center gap-1">
                          Tendência
                          <span className="relative group">
                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-surface-elevated text-text-muted text-[8px] font-black cursor-help">?</span>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2 rounded-xl bg-surface-primary border border-surface-elevated shadow-soft text-[8px] font-bold text-text-secondary leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              Compara a média dos últimos 3 meses com os 3 meses anteriores para mostrar se seus gastos estão subindo (▲), caindo (▼) ou estáveis (→).
                            </span>
                          </span>
                        </p>
                        {te.trend ? (
                          <p className={`text-sm font-black mt-0.5 flex items-center gap-1 ${te.trend.direction === 'up' ? 'text-status-danger' : te.trend.direction === 'down' ? 'text-status-success' : 'text-text-muted'}`}>
                            {te.trend.direction === 'up' ? '▲' : te.trend.direction === 'down' ? '▼' : '→'} {te.trend.percentage.toFixed(0)}%
                          </p>
                        ) : (
                          <p className="text-[9px] font-bold text-text-muted mt-1.5">
                            {te.totalMonthsInWindow < 6 ? `— (${6 - te.totalMonthsInWindow} ${te.totalMonthsInWindow === 5 ? 'mês' : 'meses'} para calcular)` : '—'}
                          </p>
                        )}
                      </div>
                    </div>

                    {(te.highestMonth || te.lowestMonth) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {te.highestMonth && te.highestMonth.value > 0 && (
                          <div className="flex items-center gap-1.5 bg-status-danger/10 rounded-xl px-3 py-1.5">
                            <span className="text-[9px] font-black text-status-danger">▲ Mês mais alto</span>
                            <span className="text-xxs font-black text-text-primary">{te.highestMonth.label}</span>
                            <span className="text-xxs font-black text-text-secondary">
                              {isPrivacyMode ? '••••' : `R$ ${te.highestMonth.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </span>
                          </div>
                        )}
                        {te.lowestMonth && te.lowestMonth.value > 0 && (
                          <div className="flex items-center gap-1.5 bg-status-success/10 rounded-xl px-3 py-1.5">
                            <span className="text-[9px] font-black text-status-success">▼ Mês mais baixo</span>
                            <span className="text-xxs font-black text-text-primary">{te.lowestMonth.label}</span>
                            <span className="text-xxs font-black text-text-secondary">
                              {isPrivacyMode ? '••••' : `R$ ${te.lowestMonth.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {te.months.map(m => {
                        const isFuture = !m.isClosed && !m.isCurrentMonth;
                        const isCurrentInactive = m.isCurrentMonth && !includeCurrentMonthTotal;
                        const isAbove = m.deviation !== null && m.deviation > 0;
                        const isBelow = m.deviation !== null && m.deviation < 0;
                        return (
                          <div
                            key={`${m.year}-${m.month}`}
                            className={`rounded-2xl p-2.5 text-center border transition-all ${
                              isFuture || isCurrentInactive
                                ? 'bg-surface-elevated/40 border-surface-elevated/30 opacity-40'
                                : isAbove
                                  ? 'bg-status-danger/10 border-status-danger/20'
                                  : isBelow
                                    ? 'bg-status-success/10 border-status-success/20'
                                    : m.isCurrentMonth
                                      ? 'bg-brand-secondary/10 border-brand-secondary/20'
                                      : 'bg-surface-elevated border-surface-elevated'
                            }`}
                          >
                            <p className="text-[8px] font-black text-text-muted uppercase tracking-wide">{m.label}</p>
                            <p className={`text-xs font-black mt-0.5 ${isFuture || isCurrentInactive ? 'text-text-muted' : 'text-text-primary'}`}>
                              {isFuture || isCurrentInactive ? '—' : isPrivacyMode ? '••••' : m.value > 0
                                ? `R$ ${m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                : 'R$ 0,00'
                              }
                            </p>
                            {!isFuture && !isCurrentInactive && m.deviation !== null && (
                              <p className={`text-[9px] font-black mt-0.5 ${isAbove ? 'text-status-danger' : isBelow ? 'text-status-success' : 'text-text-muted'}`}>
                                {isAbove ? '▲' : isBelow ? '▼' : '•'} {Math.abs(Math.round(m.deviation))}%
                              </p>
                            )}
                            {(isFuture || isCurrentInactive) && (
                              <p className="text-[8px] font-bold text-text-muted mt-0.5">—</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* TOTAL GERAL — BARRAS MENSAIS */}
                    <div className="mt-4 pt-3 border-t border-surface-elevated">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[9px] px-1.5 py-0.5 bg-brand-secondary/15 text-brand-secondary rounded-full font-black uppercase tracking-ultra-wide">GERAL</span>
                        <span className="text-[10px] font-black text-text-primary uppercase tracking-ultra-wide">Detalhamento por mês</span>
                        <span className="text-[9px] font-black text-text-muted ml-auto">
                          {averageMode === 'real'
                            ? `Média · ${te.totalMonthsInWindow} ${te.totalMonthsInWindow === 1 ? 'mês' : 'meses'}`
                            : `Ocorrência · ${te.monthsWithValue} ${te.monthsWithValue === 1 ? 'mês' : 'meses'}`}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {te.months.map(m => {
                          const isFuture = !m.isClosed && !m.isCurrentMonth;
                          const isCurrentInactive = m.isCurrentMonth && !includeCurrentMonthTotal;
                          if (isFuture) return null;
                          const maxVal = Math.max(...te.months.filter(mm => !(!mm.isClosed && !mm.isCurrentMonth)).map(mm => Math.max(mm.value, mm.projection || 0)), 1);
                          const barWidth = (m.value / maxVal) * 100;
                          const projWidth = m.projection ? (m.projection / maxVal) * 100 : 0;
                          const avgWidth = (ytdActiveAvg / maxVal) * 100;
                          const isAbove = m.deviation !== null && m.deviation > 0;
                          const isBelow = m.deviation !== null && m.deviation < 0;
                          return (
                            <div key={`${m.year}-${m.month}`} className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-text-muted uppercase w-10 shrink-0 text-right">{m.label}</span>
                              <div className="flex-1 relative h-5 bg-surface-elevated rounded-lg overflow-visible">
                                <div
                                  className={`absolute left-0 top-0 h-full rounded-lg transition-all duration-700 ${
                                  isCurrentInactive
                                    ? 'bg-surface-elevated/60'
                                    : isAbove
                                      ? 'bg-status-danger/60'
                                      : isBelow
                                        ? 'bg-status-success/60'
                                        : 'bg-brand-secondary/60'
                                }`}
                                  style={{ width: `${barWidth}%` }}
                                />
                                {m.isCurrentMonth && m.projection && (
                                  <div
                                    className="absolute left-0 top-0 h-full rounded-lg border-2 border-dashed border-text-muted bg-transparent transition-all duration-700"
                                    style={{ width: `${projWidth}%` }}
                                  />
                                )}
                                <div
                                  className="absolute top-0 h-full w-0.5 bg-brand-secondary opacity-60"
                                  style={{ left: `${Math.min(avgWidth, 99)}%` }}
                                />
                              </div>
                              <div className="w-28 shrink-0 flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-text-secondary">
                                  {isPrivacyMode ? '••••' : `R$ ${m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </span>
                                {m.isCurrentMonth && m.projection && !isPrivacyMode && (
                                  <span className="text-[8px] text-text-muted font-bold">→R$ {m.projection.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                                )}
                                {!isCurrentInactive && m.deviation !== null && (
                                  <span className={`text-[8px] font-black ${isAbove ? 'text-status-danger' : 'text-brand-primary'}`}>
                                    {isAbove ? '▲' : '▼'} {Math.abs(Math.round(m.deviation))}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-4 border-t border-surface-elevated">
                      <label className={`flex items-center gap-2 cursor-pointer select-none px-4 py-2.5 rounded-2xl border-2 transition-all ${
                        includeCurrentMonthTotal
                          ? 'bg-status-success/10 border-status-success/30 shadow-soft'
                          : 'bg-status-info/10 border-status-info/30'
                      }`}>
                        <div
                          onClick={() => setIncludeCurrentMonthTotal(p => !p)}
                          className={`w-9 h-5 rounded-full transition-all relative ${
                            includeCurrentMonthTotal ? 'bg-status-info ring-1 ring-status-info/40 shadow-lg' : 'bg-text-muted/30'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-surface-primary rounded-full shadow-soft transition-transform ${
                            includeCurrentMonthTotal ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </div>
                        <span className={`text-xxs font-black uppercase tracking-ultra-wide transition-all ${
                          includeCurrentMonthTotal ? 'text-status-success' : 'text-status-info'
                        }`}>
                          Incluir mês atual na média
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCategoryBreakdown(p => !p)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xxs font-black uppercase border transition-all active:scale-95 bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary"
                    >
                      {showCategoryBreakdown ? '▲ Ocultar análise por categoria' : '▼ Análise por categoria'}
                    </button>
                  </div>
                );
              })()}

              {!averagesData.some(a => a.totalValue > 0) && (
                <div className="mt-4 py-8 px-4 text-center bg-surface-secondary border border-surface-elevated rounded-3xl">
                  <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">Nenhuma média calculada para este período</p>
                  <p className="text-xxs text-text-muted mt-1 leading-relaxed">
                    {averagesWindow === 'year' 
                      ? FPI_COPY.averagesNeedData
                      : 'Tente mudar o período acima ou verifique se há compromissos cadastrados.'}
                  </p>
                </div>
              )}

              {showCategoryBreakdown && averagesData.some(a => a.totalValue > 0) && (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pb-4 border-b border-surface-elevated">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex bg-surface-secondary rounded-2xl p-1 border border-surface-elevated gap-1 flex-wrap">
                        {([
                          { key: 'year' as const, label: 'Ano atual' },
                          { key: 'last3' as const, label: 'Últ. 3m' },
                          { key: 'last6' as const, label: 'Últ. 6m' },
                          { key: 'all' as const, label: 'Tudo' },
                          { key: 'custom' as const, label: 'Escolher período' },
                        ]).map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setAveragesWindow(opt.key)}
                            className={`px-3 py-1.5 rounded-xl text-xxs font-black uppercase transition-all ${
                              averagesWindow === opt.key
                                ? 'bg-brand-secondary text-text-onBrand shadow-soft'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {averagesWindow === 'custom' && (
                        <div className="flex flex-wrap items-center gap-3 mt-1 w-full">
                          <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide shrink-0">De</span>
                          <div className="flex items-center gap-2 bg-surface-secondary border border-surface-elevated rounded-2xl px-3 py-2">
                            <select
                              value={customPeriodStart ? customPeriodStart.split('-')[1] : ''}
                              onChange={e => {
                                const year = customPeriodStart ? customPeriodStart.split('-')[0] : new Date().getFullYear().toString();
                                if (e.target.value) setCustomPeriodStart(`${year}-${e.target.value}`);
                              }}
                              className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                            >
                              <option value="">Mês</option>
                              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                                <option key={m} value={m}>
                                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={customPeriodStart ? customPeriodStart.split('-')[0] : ''}
                              onChange={e => {
                                const month = customPeriodStart ? customPeriodStart.split('-')[1] : '01';
                                if (e.target.value) setCustomPeriodStart(`${e.target.value}-${month}`);
                              }}
                              className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                            >
                              <option value="">Ano</option>
                              {Array.from({ length: 36 }, (_, i) => 2015 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <span className="text-xxs font-black text-text-muted uppercase">até</span>

                          <div className="flex items-center gap-2 bg-surface-secondary border border-surface-elevated rounded-2xl px-3 py-2">
                            <select
                              value={customPeriodEnd ? customPeriodEnd.split('-')[1] : ''}
                              onChange={e => {
                                const year = customPeriodEnd ? customPeriodEnd.split('-')[0] : new Date().getFullYear().toString();
                                if (e.target.value) setCustomPeriodEnd(`${year}-${e.target.value}`);
                              }}
                              className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                            >
                              <option value="">Mês</option>
                              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                                <option key={m} value={m}>
                                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={customPeriodEnd ? customPeriodEnd.split('-')[0] : ''}
                              onChange={e => {
                                const month = customPeriodEnd ? customPeriodEnd.split('-')[1] : '01';
                                if (e.target.value) setCustomPeriodEnd(`${e.target.value}-${month}`);
                              }}
                              className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                            >
                              <option value="">Ano</option>
                              {Array.from({ length: 36 }, (_, i) => 2015 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>

                          {customPeriodStart && customPeriodEnd && customPeriodStart <= customPeriodEnd && (
                            <span className="text-xxs font-black text-brand-secondary uppercase tracking-ultra-wide">
                              {(() => {
                                const [sy, sm] = customPeriodStart.split('-').map(Number);
                                const [ey, em] = customPeriodEnd.split('-').map(Number);
                                const total = (ey - sy) * 12 + (em - sm) + 1;
                                return `${total} ${total === 1 ? 'mês' : 'meses'}`;
                              })()}
                            </span>
                          )}

                          {customPeriodStart && customPeriodEnd && customPeriodStart > customPeriodEnd && (
                            <span className="text-xxs font-black text-status-danger uppercase tracking-ultra-wide">
                              ⚠ Data final anterior à inicial
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex bg-surface-secondary rounded-2xl p-1 border border-surface-elevated gap-1">
                        {([
                          { key: 'real' as const, label: 'Média real' },
                          { key: 'occurrence' as const, label: 'Média de ocorrência' },
                        ]).map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setAverageMode(opt.key)}
                            className={`px-3 py-1.5 rounded-xl text-xxs font-black uppercase transition-all ${
                              averageMode === opt.key
                                ? 'bg-brand-secondary text-text-onBrand shadow-soft'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {opt.label}
                            <span className="relative group ml-1">
                              <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-surface-elevated text-text-muted text-[9px] font-black cursor-help">?</span>
                              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 p-2.5 rounded-xl bg-surface-primary border border-surface-elevated shadow-soft text-[8px] font-bold text-text-secondary leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {opt.key === 'real'
                                  ? 'Considera todos os meses da janela, inclusive aqueles sem gastos na categoria. O total é dividido por todos os meses do período.'
                                  : 'Considera apenas os meses em que houve gasto na categoria. Ignora meses com zero despesa.'}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className={`flex items-center gap-2 cursor-pointer select-none px-4 py-2.5 rounded-2xl border-2 transition-all ${
                      includeCurrentMonth
                        ? 'bg-status-success/10 border-status-success/30 shadow-soft'
                        : 'bg-status-info/10 border-status-info/30'
                    }`}>
                      <div
                        onClick={() => setIncludeCurrentMonth(p => !p)}
                        className={`w-9 h-5 rounded-full transition-all relative ${
                          includeCurrentMonth ? 'bg-status-info ring-1 ring-status-info/40 shadow-lg' : 'bg-text-muted/30'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-surface-primary rounded-full shadow-soft transition-transform ${
                          includeCurrentMonth ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </div>
                      <span className={`text-xxs font-black uppercase tracking-ultra-wide transition-all ${
                        includeCurrentMonth ? 'text-status-success' : 'text-status-info'
                      }`}>
                        Incluir mês atual na média
                      </span>
                    </label>
                  </div>

                  <div className="space-y-6 mt-4">
                    {averagesData.filter(a => a.category !== 'Total Geral').map(({ category, average, averageOccurrence, totalValue, totalMonthsInWindow, monthsWithValue, months }) => {
                      const isTotal = category === 'Total Geral';
                      const activeAverage = averageMode === 'real' ? average : averageOccurrence;
                      const maxValue = Math.max(...months.map(m => Math.max(m.value, m.projection || 0)), 1);
                      const cardClass = isTotal ? 'bg-surface-secondary border border-surface-elevated rounded-3xl p-4 -mx-1' : '';
                      return (
                        <div key={category} className={cardClass}>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              {isTotal && (
                                <span className="text-[9px] px-2 py-0.5 bg-brand-secondary/15 text-brand-secondary rounded-full font-black uppercase tracking-ultra-wide">GERAL</span>
                              )}
                              <p className="text-sm font-black text-text-primary">{category}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 sm:text-right">
                              <div>
                                <p className="text-xxs font-black text-text-muted uppercase">Total no período</p>
                                <p className="text-sm font-black text-text-secondary">
                                  {isPrivacyMode ? '••••' : `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>
                              <div>
                                <p className="text-xxs font-black text-text-muted uppercase">
                                  {averageMode === 'real'
                                    ? `Média real · ${totalMonthsInWindow} ${totalMonthsInWindow === 1 ? 'mês' : 'meses'}`
                                    : `Média de ocorrência · ${monthsWithValue} ${monthsWithValue === 1 ? 'mês' : 'meses'}`}
                                </p>
                                <p className="text-sm font-black text-brand-secondary">
                                  {isPrivacyMode ? '••••' : `R$ ${activeAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {months.map(m => {
                              if (!m.isClosed && !m.isCurrentMonth) return null;
                              if (averageMode === 'occurrence' && m.value === 0 && !m.isCurrentMonth) return null;
                              const barWidth = (m.value / maxValue) * 100;
                              const projWidth = m.projection ? (m.projection / maxValue) * 100 : 0;
                              const avgWidth = (average / maxValue) * 100;
                              const isAbove = m.deviation !== null && m.deviation > 0;
                              const isBelow = m.deviation !== null && m.deviation < 0;
                              return (
                                <div key={`${m.year}-${m.month}`} className="flex items-center gap-3">
                                  <span className="text-xxs font-black text-text-muted uppercase w-12 shrink-0 text-right">
                                    {m.label}
                                  </span>
                                  <div className="flex-1 relative h-6 bg-surface-elevated rounded-lg overflow-visible">
                                    <div
                                      className={`absolute left-0 top-0 h-full rounded-lg transition-all duration-700 ${
                                        m.isCurrentMonth && !includeCurrentMonth ? 'bg-surface-secondary' : isAbove ? 'bg-status-danger/60' : isBelow ? 'bg-status-success/60' : 'bg-brand-secondary/60'
                                      }`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                    {m.isCurrentMonth && m.projection && (
                                      <div
                                        className="absolute left-0 top-0 h-full rounded-lg border-2 border-dashed border-text-muted bg-transparent transition-all duration-700"
                                        style={{ width: `${projWidth}%` }}
                                      />
                                    )}
                                    <div
                                      className="absolute top-0 h-full w-0.5 bg-brand-secondary opacity-60"
                                      style={{ left: `${Math.min(avgWidth, 99)}%` }}
                                    />
                                  </div>
                                  <div className="w-40 shrink-0 flex items-center gap-2">
                                    <span className="text-xxs font-black text-text-secondary">
                                      {isPrivacyMode ? '••••' : `R$ ${m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    </span>
                                    {m.isCurrentMonth && m.projection && !isPrivacyMode && (
                                      <span className="text-xxs text-text-muted font-bold">
                                        {`→ R$ ${m.projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                      </span>
                                    )}
                                    {m.deviation !== null && (
                                      <span className={`text-xxs font-black ${isAbove ? 'text-status-danger' : 'text-brand-primary'}`}>
                                        {isAbove ? '▲' : '▼'} {Math.abs(Math.round(m.deviation))}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {isTotal && (
                            <div className="border-b border-surface-elevated mt-3 mb-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowAverages(false)}
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full sm:w-auto bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary"
              >
                Ocultar Análise <ChevronUp size={16} />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AveragesAnalysisPanel;
