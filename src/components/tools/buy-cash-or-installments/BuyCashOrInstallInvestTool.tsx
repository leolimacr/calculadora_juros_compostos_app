import React, { useEffect, useMemo, useState } from 'react';
import { calculateDecision, formatCurrencyBRL, formatPercent, maskCurrencyInput, maskPercentInput, parsePtBrNumber, validateCalculation } from './finance';
import { fetchCurrentSelicRate } from './selicService';
import { CalculationInputs, CalculationResult, TaxMode } from './types';
import './buyCashOrInstallInvest.css';

const defaultState = {
  cashPrice: '',
  totalInstallmentPrice: '',
  installmentValue: '',
  installmentCount: '10',
  cashDiscount: '',
  annualRate: '',
  netAnnualRate: '',
  inflationAnnualRate: '',
  fees: '',
  iof: '',
  ignoreIR: false, // Nova opção adicionada
};

type FormState = typeof defaultState;

function toNumberState(form: FormState, taxMode: TaxMode, autoRate: number, advanced: boolean): CalculationInputs {
  return {
    cashPrice: parsePtBrNumber(form.cashPrice),
    totalInstallmentPrice: parsePtBrNumber(form.totalInstallmentPrice),
    installmentValue: parsePtBrNumber(form.installmentValue),
    installmentCount: Number(form.installmentCount || 0),
    cashDiscount: parsePtBrNumber(form.cashDiscount),
    annualRate: taxMode === 'automatic' ? autoRate : parsePtBrNumber(form.annualRate),
    netAnnualRate: advanced ? parsePtBrNumber(form.netAnnualRate) : undefined,
    inflationAnnualRate: advanced ? parsePtBrNumber(form.inflationAnnualRate) : undefined,
    fees: advanced ? parsePtBrNumber(form.fees) : 0,
    iof: advanced ? parsePtBrNumber(form.iof) : 0,
    taxMode,
    useInflation: advanced && parsePtBrNumber(form.inflationAnnualRate) > 0,
    ignoreIR: form.ignoreIR, // Repassado para a integração com o cálculo
  };
}

function ResultCard({ label, value, tone = 'neutral' }: { label: React.ReactNode; value: string; tone?: 'neutral' | 'success' | 'warning' }) {
  return (
    <div className={`cvp-card cvp-card--${tone}`}>
      <span className="cvp-card__label">{label}</span>
      <strong className="cvp-card__value">{value}</strong>
    </div>
  );
}

export default function BuyCashOrInstallInvestTool({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const [form, setForm] = useState<FormState>(defaultState);
  const[advanced, setAdvanced] = useState(false);
  const [taxMode, setTaxMode] = useState<TaxMode>('automatic');
  const [autoRate, setAutoRate] = useState(14.75);
  const [rateStatus, setRateStatus] = useState('Carregando Selic automática...');
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    fetchCurrentSelicRate()
      .then((rate) => {
        setAutoRate(rate);
        setRateStatus(`Taxa Selic atual utilizada na simulação: ${rate.toFixed(2).replace('.', ',')}% ao ano.`);
      })
      .catch(() => {
        setRateStatus('Não foi possível atualizar a Selic automaticamente agora. Você ainda pode definir a taxa manualmente.');
      });
  },[]);

  const parsedInput = useMemo(() => toNumberState(form, taxMode, autoRate, advanced), [form, taxMode, autoRate, advanced]);

  const annualRateTooltip = useMemo(() => {
    const baseText = 'Esta é a taxa anual estimada. Ela parte da taxa bruta informada (Selic automática ou manual).';

    if (form.ignoreIR) {
      return `${baseText} Você optou por desconsiderar o desconto do Imposto de Renda (IR) na simulação.`;
    }

    if (!result) {
      return `${baseText} O sistema aplica uma estimativa de Imposto de Renda (tabela regressiva) com base no prazo total do parcelamento.`;
    }

    const hasIncomeTaxDetails = result.incomeTaxRatePercent != null && result.incomeTaxEstimatedDays != null;

    if (hasIncomeTaxDetails) {
      return `${baseText} Em seguida, aplicamos o Imposto de Renda da tabela regressiva sobre os rendimentos. Nesta simulação, o prazo aproximado considerado é de ${result.incomeTaxEstimatedDays} dias, resultando em uma alíquota de ${result.incomeTaxRatePercent?.toFixed(1) || '0,0'}%.`;
    }

    return `${baseText} Aplicamos uma estimativa de Imposto de Renda (tabela regressiva) com base no prazo total do parcelamento.`;
  }, [result, form.ignoreIR]);

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCurrency(field: keyof FormState, value: string) {
    updateField(field, maskCurrencyInput(value));
  }

  function handlePercent(field: keyof FormState, value: string) {
    updateField(field, maskPercentInput(value));
  }

  function handleCalculate() {
    const validationErrors = validateCalculation(parsedInput);
    setErrors(validationErrors);
    if (validationErrors.length) {
      setResult(null);
      return;
    }
    setResult(calculateDecision(parsedInput));
  }

  function handleReset() {
    setForm(defaultState);
    setErrors([]);
    setResult(null);
    setAdvanced(false);
    setTaxMode('automatic');
  }

  const verdictTone = result?.decision === 'installments_invest' ? 'success' : result?.decision === 'pay_cash' ? 'warning' : 'neutral';

  return (
    <section className="cvp-shell">
      <header className="cvp-hero">
        <div>
          <button
            type="button"
            className="cvp-back-btn"
            onClick={() => { onNavigate?.('home'); setTimeout(() => { document.getElementById('secao-ferramentas')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
          >
            ← Voltar
          </button>
          <p className="cvp-eyebrow">Ferramenta financeira</p>
          <h1>Comprar à vista ou parcelar e investir?</h1>
          <p className="cvp-subtitle">Descubra qual decisão tende a ser melhor usando o custo do parcelamento e uma taxa baseada na Selic.</p>
        </div>
      </header>

      <div className="cvp-layout">
        <div className="cvp-panel">
          <div className="cvp-panel__header">
            <h2>Dados da compra</h2>
            <button type="button" className="cvp-link" onClick={() => setAdvanced((prev) => !prev)}>
              {advanced ? 'Voltar para o modo básico' : 'Abrir modo avançado'}
            </button>
          </div>
          <div className="cvp-grid">
            <label>
              <span>Preço à vista</span>
              <div className="cvp-input-currency">
                <span aria-hidden="true">R$</span>
                <input value={form.cashPrice} onChange={(e) => handleCurrency('cashPrice', e.target.value)} placeholder="0,00" inputMode="numeric" />
              </div>
            </label>

            <label>
              <span>Preço parcelado total</span>
              <div className="cvp-input-currency">
                <span aria-hidden="true">R$</span>
                <input value={form.totalInstallmentPrice} onChange={(e) => handleCurrency('totalInstallmentPrice', e.target.value)} placeholder="0,00" inputMode="numeric" />
              </div>
            </label>

            <label>
              <span>Valor da parcela</span>
              <div className="cvp-input-currency">
                <span aria-hidden="true">R$</span>
                <input value={form.installmentValue} onChange={(e) => handleCurrency('installmentValue', e.target.value)} placeholder="0,00" inputMode="numeric" />
              </div>
            </label>

            <label>
              <span>Quantidade de parcelas</span>
              <input className="cvp-input-padded" value={form.installmentCount} onChange={(e) => updateField('installmentCount', e.target.value.replace(/\D/g, ''))} placeholder="10" inputMode="numeric" />
            </label>

            <label>
              <span>Desconto à vista (opcional)</span>
              <div className="cvp-input-currency">
                <span aria-hidden="true">R$</span>
                <input value={form.cashDiscount} onChange={(e) => handleCurrency('cashDiscount', e.target.value)} placeholder="0,00" inputMode="numeric" />
              </div>
            </label>
          </div>
          <div className="cvp-rate-box">
            <div>
              <strong>Taxa de referência</strong>
              <p>{rateStatus}</p>
            </div>
            <div className="cvp-toggle-row">
              <label className="cvp-radio">
                <input type="radio" checked={taxMode === 'automatic'} onChange={() => setTaxMode('automatic')} />
                <span>Usar taxa automática</span>
              </label>
              <label className="cvp-radio">
                <input type="radio" checked={taxMode === 'manual'} onChange={() => setTaxMode('manual')} />
                <span>Definir taxa manualmente</span>
              </label>
            </div>
            {taxMode === 'manual' && (
              <label>
                <span>Taxa anual manual (%)</span>
                <input value={form.annualRate} onChange={(e) => handlePercent('annualRate', e.target.value)} placeholder="14,75" inputMode="decimal" />
              </label>
            )}
            {/* Checkbox com alinhamento corrigido */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.2rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.ignoreIR} 
                onChange={(e) => updateField('ignoreIR', e.target.checked)} 
              />
              <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>
                Desconsiderar abatimento de Imposto de Renda (IR)
              </span>
            </label>
          </div>
          {advanced && (
            <div className="cvp-advanced">
              <h3>Parâmetros avançados</h3>
              <div className="cvp-grid">
                <label>
                  <span>Rentabilidade líquida estimada (%)</span>
                  <input value={form.netAnnualRate} onChange={(e) => handlePercent('netAnnualRate', e.target.value)} placeholder="12,00" inputMode="decimal" />
                </label>
                <label>
                  <span>Inflação anual (%)</span>
                  <input value={form.inflationAnnualRate} onChange={(e) => handlePercent('inflationAnnualRate', e.target.value)} placeholder="4,50" inputMode="decimal" />
                </label>
                <label>
                  <span>Taxas adicionais</span>
                  <div className="cvp-input-currency">
                    <span aria-hidden="true">R$</span>
                    <input value={form.fees} onChange={(e) => handleCurrency('fees', e.target.value)} placeholder="0,00" inputMode="numeric" />
                  </div>
                </label>
                <label>
                  <span>IOF ou custo extra</span>
                  <div className="cvp-input-currency">
                    <span aria-hidden="true">R$</span>
                    <input value={form.iof} onChange={(e) => handleCurrency('iof', e.target.value)} placeholder="0,00" inputMode="numeric" />
                  </div>
                </label>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="cvp-errors" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <div className="cvp-actions">
            <button type="button" className="cvp-btn cvp-btn--primary" onClick={handleCalculate}>Calcular</button>
            <button type="button" className="cvp-btn cvp-btn--ghost" onClick={handleReset}>Limpar</button>
          </div>
        </div>

        <aside className="cvp-panel">
          <div className={`cvp-verdict cvp-verdict--${verdictTone}`}>
            <span className="cvp-verdict__tag">Veredito principal</span>
            <h2>{result?.headline || 'Preencha os dados para ver a análise'}</h2>
            <p>{result?.summary || 'A ferramenta vai comparar custo, rendimento estimado e valor do dinheiro no tempo.'}</p>
          </div>

          <div className="cvp-results">
            <ResultCard label="Vantagem financeira (saldo a favor)" value={formatCurrencyBRL(result?.finalDifference || 0)} tone={verdictTone} />
            <ResultCard label="Quanto renderia o dinheiro no período" value={formatCurrencyBRL(result?.investmentGrossEarnings || 0)} />
            <ResultCard label="Diferença entre pagar à vista e parcelar" value={formatCurrencyBRL(result?.financingExtraCost || 0)} />
            <ResultCard label="Valor presente das parcelas" value={formatCurrencyBRL(result?.presentValueOfInstallments || 0)} />
            <ResultCard label="Taxa mensal usada" value={formatPercent(result?.monthlyRate || 0)} />
            <ResultCard
              label={
                <span className="cvp-label-with-help">
                  <span>Taxa anual usada</span>
                  <span className="cvp-help-icon" title={annualRateTooltip} aria-label="Explicação sobre a taxa anual usada" tabIndex={0}>
                    ?
                  </span>
                </span>
              }
              value={formatPercent(result?.annualRate || autoRate)}
            />
          </div>

          <div className="cvp-text-block">
            <h3>Explicação didática</h3>
            <p>{result?.explanation || 'Aqui aparecerá uma explicação clara do porquê a decisão ficou mais interessante.'}</p>
          </div>

          <div className="cvp-text-block">
            <h3>Observações importantes</h3>
            <ul>
              {(result?.notes ||[
                'No modo básico, a ferramenta calcula o restante automaticamente.',
                'No modo avançado, você pode considerar taxas líquidas, inflação e custos adicionais.',
              ]).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="cvp-text-block">
            <h3>Alertas</h3>
            <ul>
              {(result?.warnings ||['Esta análise considera que o valor permanecerá investido durante todo o período.']).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}