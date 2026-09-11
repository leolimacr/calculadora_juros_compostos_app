import React, { useEffect, useMemo, useState } from 'react';
import { ToolGate } from './ToolComponents';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// --- HELPERS DE FORMATAÇÃO ---

const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);

const formatPercent = (val) => `${Number(val).toFixed(1)}%`;

// --- UI REUTILIZÁVEL ---

const ModernSlider = ({ label, value, min, max, step, onChange, formatFn, disabled = false }) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
        {formatFn ? formatFn(value) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

interface ModernNumberInputProps {
  label: string;
  value: number | string | null;
  onChange: (val: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

const ModernNumberInput: React.FC<ModernNumberInputProps> = ({ label, value, onChange, min, max, step, prefix, suffix }) => {
  const formatCurrencyInput = (val) => {
    if (val === '' || val == null || isNaN(val)) return '';

    if (!prefix && (suffix === 'anos' || suffix === 'meses')) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^\d.,]/g, '');
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const num = normalized === '' ? '' : Number(normalized);

    if (num === '') {
      onChange('');
      return;
    }

    if (!Number.isNaN(num)) {
      let clamped = num;
      if (typeof min === 'number') clamped = Math.max(min, clamped);
      if (typeof max === 'number') clamped = Math.min(max, clamped);
      onChange(clamped);
    }
  };

  const displayValue = value === '' || value == null ? '' : formatCurrencyInput(value);

  return (
    <div className="mb-5">
      <label className="text-sm font-medium text-slate-700 block mb-2">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-slate-500 text-sm">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          className={`w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
            prefix ? 'pl-9' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'}`}
        />
        {suffix && <span className="absolute right-3 text-slate-500 text-sm">{suffix}</span>}
      </div>
    </div>
  );
};

const OptionalFee = ({ label, isChecked, onCheck, rate, onRateChange, calculatedValue }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-200 ${
      isChecked ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 opacity-75'
    }`}
  >
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onCheck(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>

    <div className="flex items-center gap-2 pl-7 sm:pl-0">
      <input
        type="number"
        step="0.1"
        min="0"
        max="10"
        value={rate}
        onChange={(e) => onRateChange(Number(e.target.value))}
        disabled={!isChecked}
        className="w-16 p-1 text-sm border border-slate-300 rounded-md bg-white text-center text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <span className="text-sm text-slate-500">%</span>
      <span className="text-sm font-semibold text-slate-800 min-w-[90px] text-right">
        {isChecked ? formatCurrency(calculatedValue) : 'R$ 0'}
      </span>
    </div>
  </div>
);

const ModernToggle = ({ label, checked, onChange, hint }) => (
  <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
    <div className="flex-1">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {hint ? <div className="text-xs text-slate-500 mt-0.5">{hint}</div> : null}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export const RentVsFinanceTool = ({ onNavigate, isAuthenticated }) => {
  const [params, setParams] = useState({
    propertyValue: 500000,
    rentValue: 2500,
    downPayment: 100000,
    periodYears: 30,
    periodMonths: 0,
    amortizationSystem: 'SAC',

    includeItiv: true,
    itivRate: 3.0,
    includeNotary: true,
    notaryRate: 2.0,

    isAdvancedMode: false,

    investmentRate: 10.0,
    propertyAppreciation: 4.5,
    rentReadjustment: 4.5,

    useCurrentSelic: true,
    selicManual: 10.0,
    bankSpread: 4.0,
    financingRateManual: 10.5,
  });

  const updateParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  const [selicCurrent, setSelicCurrent] = useState<number | null>(null);
  const [selicStatus, setSelicStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  useEffect(() => {
    let isMounted = true;

    const fetchSelic = async () => {
      try {
        setSelicStatus('loading');
        const BCB_API_BASE_URL = import.meta.env.VITE_BCB_API_BASE_URL;
        const url = `${BCB_API_BASE_URL}/dados/serie/bcdata.sgs.11/dados/ultimos/20?formato=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao consultar Selic no BCB');

        const data = await res.json();
        const last = Array.isArray(data) && data.length ? data[data.length - 1] : null;
        const val = last?.valor != null ? Number(String(last.valor).replace(',', '.')) : null;

        if (!isMounted) return;

        if (Number.isFinite(val)) {
          setSelicCurrent(val);
          setSelicStatus('ok');
        } else {
          setSelicStatus('error');
        }
      } catch (e) {
        if (!isMounted) return;
        setSelicStatus('error');
      }
    };

    fetchSelic();

    return () => {
      isMounted = false;
    };
  }, []);

  const derivedFinancingRate = useMemo(() => {
    if (params.useCurrentSelic) {
      const baseSelic = Number.isFinite(selicCurrent) ? selicCurrent : params.selicManual;
      return Math.max(0, (baseSelic || 0) + params.bankSpread);
    }
    return Math.max(0, params.financingRateManual);
  }, [
    params.useCurrentSelic,
    params.bankSpread,
    params.selicManual,
    params.financingRateManual,
    selicCurrent,
  ]);

  const simulationResults = useMemo(() => {
    const totalMonths =
      ((Number(params.periodYears) >= 1 ? Number(params.periodYears) : 0) * 12) +
        (Number(params.periodMonths) >= 0 ? Number(params.periodMonths) : 0) || 12;

    const monthlyInvRate = Math.pow(1 + params.investmentRate / 100, 1 / 12) - 1;
    const monthlyPropAppr = Math.pow(1 + params.propertyAppreciation / 100, 1 / 12) - 1;
    const monthlyRentReadj = Math.pow(1 + params.rentReadjustment / 100, 1 / 12) - 1;
    const monthlyFinRate = Math.pow(1 + derivedFinancingRate / 100, 1 / 12) - 1;

    const itivCost = params.includeItiv ? params.propertyValue * (params.itivRate / 100) : 0;
    const notaryCost = params.includeNotary ? params.propertyValue * (params.notaryRate / 100) : 0;
    const totalInitialOutflow = params.downPayment + itivCost + notaryCost;

    let currentPropertyValue = params.propertyValue;
    let currentRent = params.rentValue;
    let debt = Math.max(0, params.propertyValue - params.downPayment);

    const fixedSacAmortization = debt / totalMonths;
    const priceFixedInstallment =
      monthlyFinRate === 0
        ? debt / totalMonths
        : (debt * (monthlyFinRate * Math.pow(1 + monthlyFinRate, totalMonths))) /
          (Math.pow(1 + monthlyFinRate, totalMonths) - 1);

    let renterInvestments = totalInitialOutflow;
    let buyerInvestments = 0;

    const chartData = [];

    for (let m = 1; m <= totalMonths; m++) {
      currentRent *= 1 + monthlyRentReadj;

      let installment = 0;
      let amortization = 0;
      const interest = debt * monthlyFinRate;

      if (debt > 0) {
        if (params.amortizationSystem === 'PRICE') {
          installment = priceFixedInstallment;
          amortization = installment - interest;
        } else {
          amortization = fixedSacAmortization;
          installment = amortization + interest;
        }
        debt = Math.max(0, debt - amortization);
      }

      currentPropertyValue *= 1 + monthlyPropAppr;

      const cashflowDiff = installment - currentRent;

      if (cashflowDiff > 0) renterInvestments += cashflowDiff;
      else buyerInvestments += Math.abs(cashflowDiff);

      renterInvestments *= 1 + monthlyInvRate;
      buyerInvestments *= 1 + monthlyInvRate;

      if (m % 12 === 0 || m === totalMonths) {
        const buyerNetWorth = currentPropertyValue - debt + buyerInvestments;
        chartData.push({
          Ano: m / 12,
          Comprar: Math.round(buyerNetWorth),
          Alugar: Math.round(renterInvestments),
        });
      }
    }

    const finalData = chartData[chartData.length - 1];
    const buyFinal = finalData.Comprar;
    const rentFinal = finalData.Alugar;

    const differenceAmount = Math.abs(buyFinal - rentFinal);
    const winner = buyFinal > rentFinal ? 'buy' : 'rent';

    return { winner, differenceAmount, chartData, itivCost, notaryCost, buyFinal, rentFinal };
  }, [params, derivedFinancingRate]);

  if (!isAuthenticated) {
    return (
      <ToolGate
        title="Imóveis: Alugar vs Comprar"
        description="A decisão financeira mais importante da sua vida exige matemática, não emoção."
        onNavigate={onNavigate}
      />
    );
  }

  const winnerLabel = simulationResults.winner === 'rent' ? 'ALUGAR' : 'COMPRAR';
  const loserLabel = simulationResults.winner === 'rent' ? 'COMPRAR' : 'ALUGAR';

  const winnerFinal =
    simulationResults.winner === 'rent' ? simulationResults.rentFinal : simulationResults.buyFinal;
  const loserFinal =
    simulationResults.winner === 'rent' ? simulationResults.buyFinal : simulationResults.rentFinal;

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 text-slate-800 font-sans">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            🏠 Alugar <span className="text-slate-500 text-xl font-normal">vs</span> Comprar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulador Completo de Custo de Oportunidade com Impostos.
          </p>
        </div>
        <button
          onClick={() => { onNavigate('home'); setTimeout(() => { document.getElementById('secao-ferramentas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }}
          className="self-start md:self-auto px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          ← Voltar
        </button>
      </div>

      {/* PAINEL PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 p-1.5 rounded-md text-sm">1</span>
              Dados Principais
            </h2>

            <ModernNumberInput
              label="Valor do Imóvel"
              value={params.propertyValue}
              min={10000}
              max={10000000}
              step={10000}
              prefix="R$"
              onChange={(val) => updateParam('propertyValue', val)}
            />

            <ModernNumberInput
              label="Aluguel Mensal"
              value={params.rentValue}
              min={100}
              max={100000}
              step={100}
              prefix="R$"
              onChange={(val) => updateParam('rentValue', val)}
            />

            <ModernNumberInput
              label="Valor da Entrada"
              value={params.downPayment}
              min={0}
              max={params.propertyValue}
              step={5000}
              prefix="R$"
              onChange={(val) => updateParam('downPayment', val)}
            />

            <div className="mt-6 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Custos de Aquisição à vista
              </h3>
              <div className="space-y-2">
                <OptionalFee
                  label="ITIV / ITBI"
                  isChecked={params.includeItiv}
                  onCheck={(val) => updateParam('includeItiv', val)}
                  rate={params.itivRate}
                  onRateChange={(val) => updateParam('itivRate', val)}
                  calculatedValue={simulationResults.itivCost}
                />
                <OptionalFee
                  label="Cartório (Escrituras)"
                  isChecked={params.includeNotary}
                  onCheck={(val) => updateParam('includeNotary', val)}
                  rate={params.notaryRate}
                  onRateChange={(val) => updateParam('notaryRate', val)}
                  calculatedValue={simulationResults.notaryCost}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 block mb-2">Prazo</label>
              <div className="flex gap-3">
                <ModernNumberInput
                  label=""
                  value={params.periodYears}
                  min={0}
                  max={35}
                  step={1}
                  suffix="anos"
                  onChange={(val) => updateParam('periodYears', val)}
                />
                <ModernNumberInput
                  label=""
                  value={params.periodMonths}
                  min={0}
                  max={11}
                  step={1}
                  suffix="meses"
                  onChange={(val) => updateParam('periodMonths', val)}
                />
              </div>
            </div>

            <div className="mb-5 pt-2">
              <label className="text-sm font-medium text-slate-700 block mb-3">
                Sistema de Amortização
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => updateParam('amortizationSystem', 'SAC')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    params.amortizationSystem === 'SAC'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  SAC (Decrescente)
                </button>
                <button
                  onClick={() => updateParam('amortizationSystem', 'PRICE')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    params.amortizationSystem === 'PRICE'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Price (Fixa)
                </button>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200">
              <button
                onClick={() => updateParam('isAdvancedMode', !params.isAdvancedMode)}
                className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {params.isAdvancedMode ? 'Ocultar Premissas Econômicas ↑' : 'Ajustar Premissas Econômicas ↓'}
              </button>
            </div>
          </div>

          {/* Modo Avançado */}
          {params.isAdvancedMode && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in space-y-4">
              <h2 className="text-sm text-slate-500 uppercase tracking-wider font-bold">
                Premissas de Mercado
              </h2>

              <ModernToggle
                label="Usar Selic atual automaticamente"
                checked={params.useCurrentSelic}
                onChange={(v) => updateParam('useCurrentSelic', v)}
                hint={
                  selicStatus === 'loading'
                    ? 'Consultando Selic no Banco Central...'
                    : selicStatus === 'ok'
                      ? `Selic detectada: ${formatPercent(selicCurrent)}`
                      : 'Não foi possível carregar a Selic agora (usando fallback).'
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Selic (a.a.)
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={
                      params.useCurrentSelic
                        ? Number.isFinite(selicCurrent)
                          ? (selicCurrent as number)
                          : params.selicManual
                        : params.selicManual
                    }
                    onChange={(e) => updateParam('selicManual', Number(e.target.value))}
                    disabled={params.useCurrentSelic}
                    className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800 disabled:opacity-50"
                  />
                  <div className="text-xs text-slate-500 mt-2">
                    {params.useCurrentSelic
                      ? 'Travado (automático). Desligue para editar.'
                      : 'Edite para simular outra Selic.'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Spread do banco (a.a.)
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={params.bankSpread}
                    onChange={(e) => updateParam('bankSpread', Number(e.target.value))}
                    disabled={!params.useCurrentSelic}
                    className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800 disabled:opacity-50"
                  />
                  <div className="text-xs text-slate-500 mt-2">
                    {params.useCurrentSelic
                      ? 'Financiamento = Selic + Spread.'
                      : 'Ative “Usar Selic atual” para usar esta fórmula.'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Taxa do financiamento usada (a.a.)
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {params.useCurrentSelic
                        ? `Calculada: Selic + Spread = ${formatPercent(derivedFinancingRate)}`
                        : 'Manual (você define)'}
                    </div>
                  </div>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={params.useCurrentSelic ? derivedFinancingRate : params.financingRateManual}
                    onChange={(e) => updateParam('financingRateManual', Number(e.target.value))}
                    disabled={params.useCurrentSelic}
                    className="w-28 p-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800 text-center disabled:opacity-50"
                  />
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {params.useCurrentSelic
                    ? 'Travado (automático). Desligue para editar manualmente.'
                    : 'Edite para refletir a proposta do seu banco.'}
                </div>
              </div>

              <ModernSlider
                label="Rend. Investimentos (a.a.)"
                value={params.investmentRate}
                min={2}
                max={15}
                step={0.1}
                onChange={(v) => updateParam('investmentRate', v)}
                formatFn={formatPercent}
              />
              <ModernSlider
                label="Valorização Imóvel (a.a.)"
                value={params.propertyAppreciation}
                min={0}
                max={10}
                step={0.1}
                onChange={(v) => updateParam('propertyAppreciation', v)}
                formatFn={formatPercent}
              />
              <ModernSlider
                label="Inflação Aluguel (a.a.)"
                value={params.rentReadjustment}
                min={0}
                max={10}
                step={0.1}
                onChange={(v) => updateParam('rentReadjustment', v)}
                formatFn={formatPercent}
              />
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div
            className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-all duration-500 ${
              simulationResults.winner === 'rent'
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'
            }`}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
              Veredito da simulação ({params.amortizationSystem})
            </h2>

            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Neste cenário de juros,{' '}
              <span
                className={
                  simulationResults.winner === 'rent' ? 'text-emerald-600' : 'text-indigo-600'
                }
              >
                {winnerLabel}
              </span>{' '}
              tende a deixar você com mais patrimônio.
            </p>

            <p className="mt-4 text-slate-700 text-lg">
              Em <strong className="font-bold text-slate-900">{params.periodYears} anos</strong>, a
              simulação estima que seu Patrimônio Líquido seria:{' '}
              <strong className="font-bold text-slate-900">{winnerLabel}</strong> ={' '}
              <strong className="font-bold text-slate-900">{formatCurrency(winnerFinal)}</strong>
              {' | '}
              <strong className="font-bold text-slate-900">{loserLabel}</strong> ={' '}
              <strong className="font-bold text-slate-900">{formatCurrency(loserFinal)}</strong>. A
              diferença estimada é de{' '}
              <strong className="font-bold text-slate-900">
                {formatCurrency(simulationResults.differenceAmount)}
              </strong>
              .
            </p>

            <p className="mt-3 text-sm text-slate-600">
              Taxa do financiamento usada:{' '}
              <strong className="font-bold text-slate-900">
                {formatPercent(derivedFinancingRate)}
              </strong>
              .
              {params.useCurrentSelic ? ' (Selic + spread)' : ' (manual)'}
            </p>
          </div>

          <div className="flex-1 min-h-[400px] p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Evolução do Patrimônio Líquido
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" aspect={2.5}>
                <AreaChart
                  data={simulationResults.chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="Ano"
                    tickFormatter={(t) => `${t}º ano`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(t) => `R$ ${(t / 1000).toFixed(0)}k`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    labelFormatter={(lbl) => `Ano ${lbl}`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    name="Alugando (Investimentos)"
                    dataKey="Alugar"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRent)"
                  />
                  <Area
                    type="monotone"
                    name="Comprando (Imóvel - Dívida)"
                    dataKey="Comprar"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBuy)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SESSÃO EDUCACIONAL */}
      <div className="pt-10 pb-4">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          Entenda a Matemática por trás da Decisão
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🧠</div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              A ilusão do "dinheiro jogado fora"
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aluguel é um custo. Financiamento também tem custos (juros). A ferramenta compara o que
              sobra para investir e como isso afeta o patrimônio ao longo do tempo.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">⚖️</div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Custo de oportunidade</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              A simulação considera que a diferença mensal entre “parcela” e “aluguel” pode ser
              investida, acumulando juros compostos ao longo dos anos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📑</div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Custos de aquisição</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              ITBI/ITIV e cartório normalmente são pagos à vista e entram como custo/saída inicial,
              afetando o montante que poderia estar investido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
