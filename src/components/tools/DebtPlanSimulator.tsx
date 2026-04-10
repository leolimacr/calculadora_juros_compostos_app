import { Sparkles } from 'lucide-react';
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
  perfilContexto?: NexusDebtPlanRequest["perfilContexto"];
  patrimonioContexto?: NexusDebtPlanRequest["patrimonioContexto"];
  custoOportunidadeContexto?: NexusDebtPlanRequest["custoOportunidadeContexto"];
}

export const DebtPlanSimulator: React.FC<DebtPlanSimulatorProps> = ({
  dividas,
  simulacao,
  usuarioPerfil,
  perfilContexto,
  patrimonioContexto,
  custoOportunidadeContexto,
}) => {

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DebtPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<NexusDebtPlanRequest | null>(null);
  const [staleCacheInfo, setStaleCacheInfo] = useState<{ ageDays?: number; status?: "stale_recommended" | "stale_expired" } | null>(null);

  const hasMinimumData = dividas && dividas.length > 0 && simulacao?.totalDividas > 0;

  const handleGeneratePlan = async () => {
    if (!hasMinimumData) {
      setError("Preencha e calcule suas dívidas antes de gerar o plano.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
        ...(perfilContexto && { perfilContexto }),
        dividas: cleanedDividas,
        simulacao: cleanedSimulacao,
        ...(patrimonioContexto && { patrimonioContexto }),
        ...(custoOportunidadeContexto && { custoOportunidadeContexto }),
      };

      console.log("📦 Payload enviado para generateDebtPlan:", JSON.stringify(payload, null, 2));

      const response = await callGenerateDebtPlan(payload);
      console.log("NEXUS PLAN DEBUG", { payload, response });

      if (response.needsUserConfirmationToRegenerate) {
        setPendingPayload(payload);
        setStaleCacheInfo({
          ageDays: response.cacheAgeDays,
          status: response.cacheStatus === "stale_expired" ? "stale_expired" : "stale_recommended",
        });
        setPlan(response.plan);
        return;
      }

      setPendingPayload(null);
      setStaleCacheInfo(null);
      setPlan(response.plan);
      
    } catch (e: any) {
      console.error("Erro ao gerar plano de quitação:", e);
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

  const handleUseSavedPlan = () => {
    setPendingPayload(null);
    setStaleCacheInfo(null);
  };

  const handleRegenerateConfirmed = async () => {
    if (!pendingPayload) return;

    setLoading(true);
    setError(null);

    try {
      const regeneratedResponse = await callGenerateDebtPlan({
        ...pendingPayload,
        forceRegenerate: true,
      });
      console.log("NEXUS PLAN REGENERATED DEBUG", { pendingPayload, regeneratedResponse });
      setPlan(regeneratedResponse.plan);
      setPendingPayload(null);
      setStaleCacheInfo(null);
    } catch (e: any) {
      console.error("Erro ao regerar plano de quitação:", e);
      setError(e?.message || "Não foi possível gerar um novo plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      {/* CSS DE IMPRESSÃO PARA EVITAR PÁGINAS EM BRANCO */}
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          #plano-content {
            margin: 0 !important;
            padding: 0 !important;
          }
          #plano-content > div {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 0.5rem !important;
          }
          .rounded-xl, .border, .shadow-sm {
            box-shadow: none !important;
            border-width: 0.5px !important;
          }
          .grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .grid > div {
            flex: 1 1 auto !important;
            break-inside: avoid;
          }
          table, tr, td, th {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print\\:hidden {
            display: none !important;
          }
          
          .animate-in, .fade-in, .slide-in-from-bottom-4 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          @page {
            margin: 0.5cm !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          #plano-content {
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          #plano-content > :last-child {
            page-break-after: avoid !important;
            margin-bottom: 0 !important;
          }
          
        }
      `}</style>
      <div className="mt-6 border border-teal-200 rounded-xl bg-gradient-to-br from-teal-50 to-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-teal-800 flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600" />
            Suas dívidas estão prontas para análise.
          </p>
          <p className="text-sm text-slate-600">
            Quer que o Nexus monte seu plano de quitação com base nesses dados reais?
          </p>
          <div className="mt-2 pt-2 border-t border-teal-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Plano de quitação com ajuda do Nexus
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Use o resultado da simulação para gerar um plano de ação claro para os
              próximos dias e semanas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGeneratePlan}
          disabled={loading || !hasMinimumData}
          className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors shadow-sm ${
            loading || !hasMinimumData
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          <Sparkles size={15} />
          {loading ? "Gerando plano..." : "Gerar meu plano com o Nexus"}
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
  
      {staleCacheInfo && plan && (
        <div className={`mt-4 rounded-xl border p-4 ${
          staleCacheInfo.status === "stale_expired"
            ? "border-amber-300 bg-amber-50"
            : "border-blue-200 bg-blue-50"
        }`}>
          <p className="text-sm font-semibold text-slate-800">
            Você já tem um plano salvo há {staleCacheInfo.ageDays ?? "alguns"} dias.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {staleCacheInfo.status === "stale_expired"
              ? "Esse plano já está mais desatualizado. Deseja gerar um novo agora?"
              : "Você pode usar o plano salvo ou pedir ao Nexus para gerar uma versão nova."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUseSavedPlan}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Usar plano salvo
            </button>
            <button
              type="button"
              onClick={handleRegenerateConfirmed}
              disabled={loading}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Gerando novo plano..." : "Gerar novo plano"}
            </button>
          </div>
        </div>
      )}

      {plan && (
        <div
          id="plano-content"
          className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 print:mt-0 print:space-y-3 print:animate-none print:text-black"
        >

          {/* -- CABEÇALHO DO RELATÓRIO -- */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 print:break-inside-avoid">
            <div className="p-2 bg-teal-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-black tracking-wider">Nexus — Plano Gerado</p>
              <h3 className="text-base font-black text-slate-800">Seu Plano de Quitação de Dívidas</h3>
            </div>
          </div>

          {/* -- 1. RESUMO EXECUTIVO -- */}
          <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-5 shadow-sm print:break-inside-avoid print:shadow-none">
            <p className="text-[10px] text-teal-600 uppercase font-black tracking-wider mb-3">Resumo Executivo</p>

            {plan.resumo3Linhas?.length > 0 ? (
              <div className="space-y-2">
                {plan.resumo3Linhas.slice(0, 3).map((linha, idx) => (
                  <p key={idx} className="text-sm text-slate-800 leading-relaxed">
                    <span className="font-black text-teal-700 mr-2">{idx + 1}.</span>
                    {linha}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-base text-slate-800 leading-relaxed">
                <strong>{plan.prioridade?.recomendacaoPrincipal || `Priorize ${plan.prioridade?.nomeDividaPrioritaria || "a dívida prioritária"}.`}</strong>{" "}
                Seguindo este plano, você pode quitar suas dívidas em{" "}
                <strong>{plan.planoHorizonte?.prazoEstimadoQuitacaoMeses ?? "?"} meses</strong>{" "}
                e economizar aproximadamente{" "}
                <strong>
                  {plan.planoHorizonte?.economiaEstimadaJuros?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) ?? "R$ 0"}
                </strong>{" "}
                em juros.
              </p>
            )}
          </div>

          {/* -- 1.1 EXPLICAÇÃO DO HORIZONTE E ESFORÇO MENSAL -- */}
          {(plan.explicacaoCenarioAtual || plan.explicacaoMetaPlano || plan.explicacaoEsforcoMensal) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <div className="grid gap-3 md:grid-cols-3">
                {plan.explicacaoCenarioAtual && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                      Onde você está hoje
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {plan.explicacaoCenarioAtual}
                    </p>
                  </div>
                )}

                {plan.explicacaoMetaPlano && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                      Para onde este plano quer te levar
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {plan.explicacaoMetaPlano}
                    </p>
                  </div>
                )}

                {plan.explicacaoEsforcoMensal && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                      O que você precisa fazer por mês
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {plan.explicacaoEsforcoMensal}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -- 2. DÍVIDA PRIORITÁRIA -- */}
          {plan.prioridade && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 print:break-inside-avoid">
              <p className="text-[10px] text-orange-500 uppercase font-black tracking-wider mb-3">Dívida Prioritária</p>
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
          
          {/* -- 2.1 DIAGNÓSTICO FINANCEIRO -- */}
          {plan.diagnosticoFinanceiro && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                  Diagnóstico financeiro
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Sua fotografia financeira atual
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Patrimônio ativo
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.diagnosticoFinanceiro.patrimonioAtivo != null
                      ? plan.diagnosticoFinanceiro.patrimonioAtivo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Patrimônio passivo
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.diagnosticoFinanceiro.patrimonioPassivo != null
                      ? plan.diagnosticoFinanceiro.patrimonioPassivo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Patrimônio líquido
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.diagnosticoFinanceiro.patrimonioLiquido != null
                      ? plan.diagnosticoFinanceiro.patrimonioLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Renda mensal considerada
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.diagnosticoFinanceiro.rendaMensalConsiderada != null
                      ? plan.diagnosticoFinanceiro.rendaMensalConsiderada.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "Não informada"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Reserva atual
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.diagnosticoFinanceiro.reservaAtual != null
                      ? plan.diagnosticoFinanceiro.reservaAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "Não informada"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Meta de reserva
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.diagnosticoFinanceiro.metaReservaEmMeses != null
                      ? `${plan.diagnosticoFinanceiro.metaReservaEmMeses} meses`
                      : "Não informada"}
                  </p>
                </div>
              </div>

              {plan.diagnosticoFinanceiro.diagnosticoResumo && (
                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Leitura do cenário
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {plan.diagnosticoFinanceiro.diagnosticoResumo}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* -- 2.2 CUSTO DE OPORTUNIDADE -- */}
          {plan.analiseCustoOportunidade && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 print:break-inside-avoid">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] text-teal-600 uppercase font-black tracking-wider">
                  Custo de oportunidade
                </p>
                <p className="text-[10px] text-teal-500 font-semibold">
                  Quitar agora ou preservar liquidez?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-teal-100 bg-white/80 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Taxa de referência ao ano
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.analiseCustoOportunidade.taxaReferenciaAno != null
                      ? `${plan.analiseCustoOportunidade.taxaReferenciaAno.toFixed(2)}% a.a.`
                      : "Não informada"}
                  </p>
                </div>

                <div className="rounded-lg border border-teal-100 bg-white/80 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Retorno líquido estimado
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {plan.analiseCustoOportunidade.retornoLiquidoEstimadoAno != null
                      ? `${plan.analiseCustoOportunidade.retornoLiquidoEstimadoAno.toFixed(2)}% a.a.`
                      : "Não informado"}
                  </p>
                </div>
              </div>

              {plan.analiseCustoOportunidade.resumoDecisao && (
                <div className="mt-3 rounded-lg border border-teal-100 bg-white/80 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Decisão estratégica
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {plan.analiseCustoOportunidade.resumoDecisao}
                  </p>
                </div>
              )}

              {plan.analiseCustoOportunidade.justificativa && (
                <div className="mt-2 rounded-lg border border-teal-100 bg-white/70 p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                    Justificativa
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {plan.analiseCustoOportunidade.justificativa}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* -- 3. DECISÕES POR DÍVIDA -- */}
          {plan.decisoesPorDivida && plan.decisoesPorDivida.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                  Decisões por dívida
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  O que atacar, amortizar, negociar ou manter
                </p>
              </div>

              <div className="space-y-3">
                {plan.decisoesPorDivida
                  .slice()
                  .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
                  .map((decisao, idx) => {
                    const acaoLabelMap: Record<string, string> = {
                      quitar_agressivamente: "Quitar agressivamente",
                      amortizar: "Amortizar",
                      manter_parcelas: "Manter parcelas",
                      renegociar: "Renegociar",
                      nao_antecipar: "Não antecipar",
                    };

                    const acaoClassMap: Record<string, string> = {
                      quitar_agressivamente: "bg-rose-100 text-rose-700",
                      amortizar: "bg-orange-100 text-orange-700",
                      manter_parcelas: "bg-sky-100 text-sky-700",
                      renegociar: "bg-amber-100 text-amber-700",
                      nao_antecipar: "bg-emerald-100 text-emerald-700",
                    };

                    const acaoLabel =
                      acaoLabelMap[decisao.acaoRecomendada] ??
                      decisao.acaoRecomendada.replaceAll("_", " ");

                    const acaoClass =
                      acaoClassMap[decisao.acaoRecomendada] ??
                      "bg-slate-100 text-slate-700";

                    return (
                      <div
                        key={`${decisao.nomeDivida}-${idx}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/40 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                              Prioridade {(decisao.ordem ?? idx + 1)}
                            </p>
                            <p className="text-sm font-black text-slate-800">
                              {decisao.nomeDivida}
                            </p>
                          </div>

                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight ${acaoClass}`}
                          >
                            {acaoLabel}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                          {decisao.justificativa}
                        </p>

                        {decisao.observacoes && (
                          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                            {decisao.observacoes}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* -- 4. HORIZONTE DE QUITAÇÃO (KPIs) -- */}
          {(plan.planoHorizonte?.prazoEstimadoQuitacaoMeses != null || plan.planoHorizonte?.economiaEstimadaJuros != null) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plan.planoHorizonte.prazoEstimadoQuitacaoMeses != null && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:break-inside-avoid print:shadow-none">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-2">
                    Horizonte estimado
                  </p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-slate-800 leading-none">
                      {plan.planoHorizonte.prazoEstimadoQuitacaoMeses}
                    </p>
                    <p className="text-sm text-slate-500 font-bold pb-0.5">
                      meses
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Tempo estimado para ficar livre das dívidas seguindo este plano.
                  </p>
                </div>
              )}

              {plan.planoHorizonte.economiaEstimadaJuros != null && (
                <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
                  <p className="text-[10px] text-teal-600 uppercase font-black tracking-wider mb-2">
                    Economia projetada
                  </p>
                  <p className="text-3xl font-black text-teal-700 leading-none">
                    {plan.planoHorizonte.economiaEstimadaJuros.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <p className="mt-2 text-xs text-teal-600 font-semibold">
                    Economia aproximada de juros se você seguir a estratégia proposta.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* -- 5. VISÃO DAS DÍVIDAS CADASTRADAS -- */}
          {dividas.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                  Visão das dívidas cadastradas
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Base usada para montar o plano
                </p>
              </div>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-sm print:text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-2 font-semibold text-slate-500">Dívida</th>
                      <th className="pb-2 font-semibold text-slate-500 text-right">Saldo</th>
                      <th className="pb-2 font-semibold text-slate-500 text-right">Taxa mensal</th>
                      <th className="pb-2 font-semibold text-slate-500 text-right">Parcela</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dividas]
                      .sort((a, b) => {
                        const ordemA = plan.decisoesPorDivida?.find((item) => item.nomeDivida === a.nome)?.ordem ?? 999;
                        const ordemB = plan.decisoesPorDivida?.find((item) => item.nomeDivida === b.nome)?.ordem ?? 999;

                        if (ordemA !== ordemB) return ordemA - ordemB;
                        return b.taxaJurosMes - a.taxaJurosMes;
                      })
                      .map((d, idx) => {
                        const isPriority = plan.prioridade?.nomeDividaPrioritaria === d.nome;
                        const decisao = plan.decisoesPorDivida?.find((item) => item.nomeDivida === d.nome);

                        const acaoLabelMap: Record<string, string> = {
                          quitar_agressivamente: "Quitar",
                          amortizar: "Amortizar",
                          manter_parcelas: "Manter",
                          renegociar: "Renegociar",
                          nao_antecipar: "Não antecipar",
                        };

                        return (
                          <tr
                            key={idx}
                            className={`border-b border-slate-50 print:break-inside-avoid ${isPriority ? "bg-orange-50/30" : ""}`}
                          >
                            <td className="py-3 font-medium text-slate-800">
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span>{d.nome}</span>
                                  {isPriority && (
                                    <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                      Prioritária
                                    </span>
                                  )}
                                  {decisao?.acaoRecomendada && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                      {acaoLabelMap[decisao.acaoRecomendada] ?? decisao.acaoRecomendada}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-right text-slate-700">
                              {d.saldoAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td className="py-3 text-right text-slate-700">
                              {d.taxaJurosMes.toFixed(2)}%
                            </td>
                            <td className="py-3 text-right text-slate-700">
                              {d.parcelaMensal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "-"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                * Esta visão consolida os dados cadastrados e ajuda a contextualizar o plano. A decisão final sobre cada dívida considera juros, parcela, liquidez, reserva, garantia e custo de oportunidade.
              </p>
            </div>
          )}

          {/* -- PRÓXIMOS 7 DIAS -- */}
          {plan.passos7Dias?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-4">Próximos 7 dias</p>
              <ol className="space-y-3 print:space-y-2">
                {plan.passos7Dias.map((step) => (
                  <li key={step.ordem} className="flex items-start gap-3 print:break-inside-avoid">
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

          {/* -- PRÓXIMOS 30 DIAS -- */}
          {plan.passos30Dias?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-4">Próximos 30 dias</p>
              <ol className="space-y-3 print:space-y-2">
                {plan.passos30Dias.map((step) => (
                  <li key={step.ordem} className="flex items-start gap-3 print:break-inside-avoid">
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

          {/* -- PRÓXIMOS 90 DIAS -- */}
          {plan.passos90Dias?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-4">Próximos 90 dias</p>
              <ol className="space-y-3 print:space-y-2">
                {plan.passos90Dias.map((step) => (
                  <li key={step.ordem} className="flex items-start gap-3 print:break-inside-avoid">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center mt-0.5">
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

          {/* -- ALERTAS IMPORTANTES -- */}
          {plan.alertasImportantes?.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 print:break-inside-avoid">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] text-rose-500 uppercase font-black tracking-wider">
                  Alertas importantes
                </p>
                <p className="text-[10px] text-rose-400 font-semibold">
                  Pontos que exigem atenção
                </p>
              </div>

              <div className="space-y-2.5">
                {plan.alertasImportantes.map((alerta, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-rose-100 bg-white/70 px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                      <p className="text-sm text-rose-700 leading-relaxed">
                        {alerta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -- BOTÃO PDF -- */}
          <div className="pt-4 border-t border-slate-100 print:hidden">
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
    </>
  );
};







