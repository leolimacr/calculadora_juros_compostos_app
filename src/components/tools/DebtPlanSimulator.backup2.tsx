// src/components/tools/finance/DebtPlanSimulator.tsx
import React, { useState } from "react";
import {
  callGenerateDebtPlan,
  NexusDebtPlanRequest,
  DebtPlanResponse,
  DebtItem,
  DebtSimulationSummary,
} from "../../services/nexusDebtPlanClient";
interface DebtPlanSimulatorProps {
  // Resultado da sua calculadora de dívidas
  dividas: DebtItem[];
  simulacao: DebtSimulationSummary;
  usuarioPerfil?: NexusDebtPlanRequest["usuarioPerfil"];
  patrimonioContexto?: NexusDebtPlanRequest["patrimonioContexto"];
  custoOportunidadeContexto?: NexusDebtPlanRequest["custoOportunidadeContexto"];
}

export const DebtPlanSimulator: React.FC<DebtPlanSimulatorProps> = ({
  dividas,
  simulacao,
  usuarioPerfil,
  patrimonioContexto,
  custoOportunidadeContexto,
}) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DebtPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasMinimumData = dividas && dividas.length > 0 && simulacao?.totalDividas > 0;

  const handleGeneratePlan = async () => {
    if (!hasMinimumData) {
      setError("Preencha e calcule suas dívidas antes de gerar o plano.");
      return;
    }
  
    setLoading(true);
    setError(null);

    try {
      // Limpa cada dívida: remove campos com null/undefined
      const cleanedDividas = dividas.map(d => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(d)) {
          if (value !== null && value !== undefined) {
            cleaned[key] = value;
          }
        }
        return cleaned;
      });

      const cleanedSimulacao: any = {
        totalDividas: simulacao.totalDividas,
        custoTotalJurosAtual: simulacao.custoTotalJurosAtual,
        prazoEstimadoQuitacaoAtual: simulacao.prazoEstimadoQuitacaoAtual,
      };
      if (simulacao.rendaMensalEstimada !== null && simulacao.rendaMensalEstimada !== undefined) {
        cleanedSimulacao.rendaMensalEstimada = simulacao.rendaMensalEstimada;
      }
      if (simulacao.prazoEstimadoQuitacaoOtimizado !== null && simulacao.prazoEstimadoQuitacaoOtimizado !== undefined) {
        cleanedSimulacao.prazoEstimadoQuitacaoOtimizado = simulacao.prazoEstimadoQuitacaoOtimizado;
      }
      if (simulacao.economiaEstimadaJuros !== null && simulacao.economiaEstimadaJuros !== undefined) {
        cleanedSimulacao.economiaEstimadaJuros = simulacao.economiaEstimadaJuros;
      }

      const payload: NexusDebtPlanRequest = {
        usuarioPerfil,
        dividas: cleanedDividas,
        simulacao: cleanedSimulacao,
      };
      
      console.log("📦 Payload enviado para generateDebtPlan:", JSON.stringify(payload, null, 2));

      const responsePlan = await callGenerateDebtPlan(payload);
      console.log("NEXUS PLAN DEBUG", { payload, responsePlan });
      setPlan(responsePlan);
    } catch (e: any) {
      console.error("Erro ao gerar plano de quitação:", e);
      // Exibe mais detalhes se disponíveis
      if (e.response) {
        console.error("Detalhes da resposta:", e.response);
      }
      setError(e?.message || "Não foi possível gerar o plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="mt-6 border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Plano de quitação com ajuda do Nexus
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Use o resultado da simulação para gerar um plano de ação claro para os
            próximos dias e semanas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePlan}
          disabled={loading || !hasMinimumData}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            loading || !hasMinimumData
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {loading ? "Gerando plano..." : "Gerar meu plano detalhado"}
        </button>
      </div>

      {!hasMinimumData && (
        <p className="text-xs text-amber-600 mt-3">
          Você precisa informar suas dívidas e calcular primeiro para o Nexus conseguir
          montar um plano coerente.
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-600 mt-4">
          {error}
        </p>
      )}
      {plan && (
        <div id="plano-content" className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ── CABEÇALHO DO RELATÓRIO ── */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-teal-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-black tracking-wider">Nexus — Plano Gerado</p>
              <h3 className="text-base font-black text-slate-800">Seu Plano de Quitação de Dívidas</h3>
            </div>
          </div>

          {/* ── 1. DIAGNÓSTICO ── */}
          {plan.resumo3Linhas?.length > 0 && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
              <p className="text-[10px] text-teal-600 uppercase font-black tracking-wider mb-3">📋 Diagnóstico</p>
              <ul className="space-y-2">
                {plan.resumo3Linhas.map((linha, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    {linha}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── 2. DÍVIDA PRIORITÁRIA ── */}
          {plan.prioridade && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <p className="text-[10px] text-orange-500 uppercase font-black tracking-wider mb-3">🎯 Dívida Prioritária</p>
              <p className="text-base font-black text-slate-800 mb-2">{plan.prioridade.nomeDividaPrioritaria}</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700 flex-shrink-0">Motivo:</span>
                  <span>{plan.prioridade.motivo}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700 flex-shrink-0">Recomendação:</span>
                  <span>{plan.prioridade.recomendacaoPrincipal}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. HORIZONTE DE QUITAÇÃO (KPIs) ── */}
          {(plan.planoHorizonte?.prazoEstimadoQuitacaoMeses != null || plan.planoHorizonte?.economiaEstimadaJuros != null) && (
            <div className="grid grid-cols-2 gap-3">
              {plan.planoHorizonte.prazoEstimadoQuitacaoMeses != null && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">⏱ Livre das dívidas em</p>
                  <p className="text-2xl font-black text-slate-800">{plan.planoHorizonte.prazoEstimadoQuitacaoMeses}</p>
                  <p className="text-xs text-slate-500 font-semibold">meses</p>
                </div>
              )}
              {plan.planoHorizonte.economiaEstimadaJuros != null && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-center shadow-sm">
                  <p className="text-[10px] text-teal-600 uppercase font-black tracking-wider mb-1">💰 Economia em juros</p>
                  <p className="text-2xl font-black text-teal-700">
                    {plan.planoHorizonte.economiaEstimadaJuros.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-xs text-teal-500 font-semibold">se seguir o plano</p>
                </div>
              )}
            </div>
          )}

          {/* ── 4. PRÓXIMOS 7 DIAS ── */}
          {plan.passos7Dias?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-4">⚡ Próximos 7 dias</p>
              <ol className="space-y-3">
                {plan.passos7Dias.map((step) => (
                  <li key={step.ordem} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black flex items-center justify-center mt-0.5">
                      {step.ordem}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{step.descricao}</p>
                      {step.observacoes && (
                        <p className="text-xs text-slate-500 mt-0.5">{step.observacoes}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── 5. PRÓXIMOS 30 DIAS ── */}
          {plan.passos30Dias?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-4">📅 Próximos 30 dias</p>
              <ol className="space-y-3">
                {plan.passos30Dias.map((step) => (
                  <li key={step.ordem} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-400 text-white text-xs font-black flex items-center justify-center mt-0.5">
                      {step.ordem}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{step.descricao}</p>
                      {step.observacoes && (
                        <p className="text-xs text-slate-500 mt-0.5">{step.observacoes}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── 6. ALERTAS IMPORTANTES ── */}
          {plan.alertasImportantes?.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
              <p className="text-[10px] text-rose-500 uppercase font-black tracking-wider mb-3">⚠️ Alertas Importantes</p>
              <ul className="space-y-2">
                {plan.alertasImportantes.map((alerta, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-rose-700">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                    {alerta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── BOTÃO PDF ── */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Gerar plano em PDF
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

