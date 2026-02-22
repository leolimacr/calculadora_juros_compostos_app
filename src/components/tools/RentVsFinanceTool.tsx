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
  }).format(val); // Formatação via Intl.NumberFormat. [web:20]

const formatPercent = (val) => `${Number(val).toFixed(1)}%`;

// --- UI REUTILIZÁVEL ---

const ModernSlider = ({ label, value, min, max, step, onChange, formatFn, disabled = false }) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
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
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const ModernNumberInput = ({ label, value, onChange, min, max, step, prefix, suffix }) => {
	
	const formatCurrencyInput = (val) => {
    if (val === '' || val == null || isNaN(val)) return '';

    // Campos inteiros: anos e meses sem casas decimais
    if (!prefix && (suffix === 'anos' || suffix === 'meses')) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }

    // Campos monetários: sempre duas casas decimais
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

  const displayValue =
    value === '' || value == null ? '' : formatCurrencyInput(value);

  return (
    <div className="mb-5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 dark:text-gray-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          className={`w-full p-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
            prefix ? 'pl-9' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'}`}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 dark:text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const OptionalFee = ({ label, isChecked, onCheck, rate, onRateChange, calculatedValue }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-200 ${
      isChecked
        ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10'
        : 'border-gray-200 dark:border-gray-700 opacity-75'
    }`}
  >
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onCheck(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
      />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
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
        className="w-16 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-center text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[90px] text-right">
        {isChecked ? formatCurrency(calculatedValue) : 'R$ 0'}
      </span>
    </div>
  </div>
);

// Toggle simples
const ModernToggle = ({ label, checked, onChange, hint }) => (
  <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/30">
    <div className="flex-1">
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
      {hint ? <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</div> : null}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
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
  // 1) Estado: parâmetros do simulador
  const [params, setParams] = useState({
    // Básico
    propertyValue: 500000,
    rentValue: 2500,
    downPayment: 100000,
    periodYears: 30,
	periodMonths: 0,
    amortizationSystem: 'SAC',

    // Custos de Aquisição
    includeItiv: true,
    itivRate: 3.0,
    includeNotary: true,
    notaryRate: 2.0,

    // Modo avançado
    isAdvancedMode: false,

    // Premissas econômicas
    investmentRate: 10.0,
    propertyAppreciation: 4.5,
    rentReadjustment: 4.5,

    // Juros do financiamento (nova modelagem)
    useCurrentSelic: true, // toggle principal
    selicManual: 10.0, // usado quando useCurrentSelic = false
    bankSpread: 4.0, // financiamento = selic + spread (quando useCurrentSelic = true)
    financingRateManual: 10.5, // usado quando useCurrentSelic = false
  });

  const updateParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  // 2) Estado: Selic atual (vinda da API do BCB)
  const [selicCurrent, setSelicCurrent] = useState(null); // número (a.a.)
  const [selicStatus, setSelicStatus] = useState('idle'); // idle | loading | ok | error

  // 3) Buscar Selic atual (BCB SGS série 11)
  useEffect(() => {
    let isMounted = true;

    const fetchSelic = async () => {
      try {
        setSelicStatus('loading');

        // “ultimos/N” (limitado a 20) e pega o último registro retornado. [web:65]
        const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/20?formato=json';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao consultar Selic no BCB');

        const data = await res.json();
        // Formato típico: [{ data: "dd/MM/aaaa", valor: "x.xx" }, ...]
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
  }, []); // useEffect para fetch inicial e setState do resultado. [web:88]

  // 4) Taxas derivadas (financiamento efetivo)
  const derivedFinancingRate = useMemo(() => {
    if (params.useCurrentSelic) {
      // Se Selic ainda não carregou, usa selicManual como fallback “temporário”
      const baseSelic = Number.isFinite(selicCurrent) ? selicCurrent : params.selicManual;
      return Math.max(0, baseSelic + params.bankSpread);
    }
    return Math.max(0, params.financingRateManual);
  }, [params.useCurrentSelic, params.bankSpread, params.selicManual, params.financingRateManual, selicCurrent]); // memoização da taxa. [web:34]

  // 5) Simulação
  const simulationResults = useMemo(() => {
    const totalMonths = ((Number(params.periodYears) >= 1 ? Number(params.periodYears) : 0) * 12) + (Number(params.periodMonths) >= 0 ? Number(params.periodMonths) : 0) || 12;

    // Taxas mensais equivalentes
    const monthlyInvRate = Math.pow(1 + params.investmentRate / 100, 1 / 12) - 1;
    const monthlyPropAppr = Math.pow(1 + params.propertyAppreciation / 100, 1 / 12) - 1;
    const monthlyRentReadj = Math.pow(1 + params.rentReadjustment / 100, 1 / 12) - 1;
    const monthlyFinRate = Math.pow(1 + derivedFinancingRate / 100, 1 / 12) - 1;

    // Custos de aquisição
    const itivCost = params.includeItiv ? params.propertyValue * (params.itivRate / 100) : 0;
    const notaryCost = params.includeNotary ? params.propertyValue * (params.notaryRate / 100) : 0;
    const totalInitialOutflow = params.downPayment + itivCost + notaryCost;

    // Valores iniciais
    let currentPropertyValue = params.propertyValue;
    let currentRent = params.rentValue;
    let debt = Math.max(0, params.propertyValue - params.downPayment);

    // Amortização base
    const fixedSacAmortization = debt / totalMonths;
    const priceFixedInstallment =
      monthlyFinRate === 0
        ? debt / totalMonths
        : (debt * (monthlyFinRate * Math.pow(1 + monthlyFinRate, totalMonths))) /
          (Math.pow(1 + monthlyFinRate, totalMonths) - 1);

    // Patrimônios iniciais
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
  }, [params, derivedFinancingRate]); // derivedFinancingRate é premissa direta da simulação. [web:34]

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
    <div className="w-full max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans">
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            🏠 Alugar <span className="text-gray-400 text-xl font-normal">vs</span> Comprar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Simulador Completo de Custo de Oportunidade com Impostos.
          </p>
        </div>
        <button
          onClick={onNavigate}
          className="self-start md:self-auto px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          ← Voltar
        </button>
      </div>

      {/* PAINEL PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
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

            {/* Custos */}
            <div className="mt-6 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Prazo
              </label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                Sistema de Amortização
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => updateParam('amortizationSystem', 'SAC')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    params.amortizationSystem === 'SAC'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300'
                      : 'text-gray-500 dark:hover:text-gray-200'
                  }`}
                >
                  SAC (Decrescente)
                </button>
                <button
                  onClick={() => updateParam('amortizationSystem', 'PRICE')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    params.amortizationSystem === 'PRICE'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300'
                      : 'text-gray-500 dark:hover:text-gray-200'
                  }`}
                >
                  Price (Fixa)
                </button>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => updateParam('isAdvancedMode', !params.isAdvancedMode)}
                className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                {params.isAdvancedMode ? 'Ocultar Premissas Econômicas ↑' : 'Ajustar Premissas Econômicas ↓'}
              </button>
            </div>
          </div>

          {/* Modo Avançado */}
          {params.isAdvancedMode && (
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm animate-in fade-in space-y-4">
              <h2 className="text-sm text-gray-500 uppercase tracking-wider font-bold">Premissas de Mercado</h2>

              {/* SELIC / JUROS */}
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
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Selic (a.a.)
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={params.useCurrentSelic ? (Number.isFinite(selicCurrent) ? selicCurrent : params.selicManual) : params.selicManual}
                    onChange={(e) => updateParam('selicManual', Number(e.target.value))}
                    disabled={params.useCurrentSelic}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {params.useCurrentSelic
                      ? 'Travado (automático). Desligue para editar.'
                      : 'Edite para simular outra Selic.'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {params.useCurrentSelic
                      ? 'Financiamento = Selic + Spread.'
                      : 'Ative “Usar Selic atual” para usar esta fórmula.'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Taxa do financiamento usada (a.a.)
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
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
                    className="w-28 p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-center disabled:opacity-50"
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {params.useCurrentSelic
                    ? 'Travado (automático). Desligue para editar manualmente.'
                    : 'Edite para refletir a proposta do seu banco.'}
                </div>
              </div>

              {/* Restante das premissas */}
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
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800/50'
                : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 dark:from-indigo-900/20 dark:to-blue-900/20 dark:border-indigo-800/50'
            }`}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Veredito da simulação ({params.amortizationSystem})
            </h2>

            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Neste cenário de juros,{' '}
              <span
                className={
                  simulationResults.winner === 'rent'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }
              >
                {winnerLabel}
              </span>{' '}
              tende a deixar você com mais patrimônio.
            </p>

            <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg">
              Em <strong className="font-bold text-gray-900 dark:text-white">{params.periodYears} anos</strong>, a simulação estima
              que seu Patrimônio Líquido seria:{' '}
              <strong className="font-bold text-gray-900 dark:text-white">{winnerLabel}</strong> ={' '}
              <strong className="font-bold text-gray-900 dark:text-white">{formatCurrency(winnerFinal)}</strong>
              {' | '}
              <strong className="font-bold text-gray-900 dark:text-white">{loserLabel}</strong> ={' '}
              <strong className="font-bold text-gray-900 dark:text-white">{formatCurrency(loserFinal)}</strong>.
              {' '}
              A diferença estimada é de{' '}
              <strong className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(simulationResults.differenceAmount)}
              </strong>
              .
            </p>

            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Taxa do financiamento usada: <strong className="font-bold text-gray-900 dark:text-white">{formatPercent(derivedFinancingRate)}</strong>.
              {params.useCurrentSelic ? ' (Selic + spread)' : ' (manual)'}
            </p>
          </div>

          <div className="flex-1 min-h-[400px] p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Evolução do Patrimônio Líquido</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" aspect={2.5}>
                <AreaChart data={simulationResults.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <XAxis
                    dataKey="Ano"
                    tickFormatter={(t) => `${t}º ano`}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(t) => `R$ ${(t / 1000).toFixed(0)}k`}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    labelFormatter={(lbl) => `Ano ${lbl}`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Entenda a Matemática por trás da Decisão
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🧠</div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">A ilusão do "dinheiro jogado fora"</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Aluguel é um custo. Financiamento também tem custos (juros). A ferramenta compara o que sobra para investir e
              como isso afeta o patrimônio ao longo do tempo.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">⚖️</div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Custo de oportunidade</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              A simulação considera que a diferença mensal entre “parcela” e “aluguel” pode ser investida, acumulando juros
              compostos ao longo dos anos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📑</div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Custos de aquisição</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              ITBI/ITIV e cartório normalmente são pagos à vista e entram como custo/saída inicial, afetando o montante que
              poderia estar investido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
