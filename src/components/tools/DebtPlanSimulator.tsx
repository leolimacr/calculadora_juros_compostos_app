import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';
import html2pdf from 'html2pdf.js';
// src/components/tools/finance/DebtPlanSimulator.tsx
import React, { useState, useEffect } from "react";
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
  initialPlanMarkdown?: string;
}

export const DebtPlanSimulator: React.FC<DebtPlanSimulatorProps> = ({
  dividas,
  simulacao,
  usuarioPerfil,
  perfilContexto,
  patrimonioContexto,
  custoOportunidadeContexto,
  initialPlanMarkdown,
}) => {

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DebtPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<NexusDebtPlanRequest | null>(null);
  const [staleCacheInfo, setStaleCacheInfo] = useState<{ ageDays?: number; status?: "stale_recommended" | "stale_expired" } | null>(null);
  
  useEffect(() => {
    if (initialPlanMarkdown) {
      setPlan({
        success: true,
        format: "markdown",
        planoMarkdown: initialPlanMarkdown,
        generatedAt: new Date().toISOString(),
      } as DebtPlanResponse);
      setError(null);
    }
  }, [initialPlanMarkdown]);

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

  useEffect(() => {
    if (plan) {
      console.log("NEXUS_PLAN_DEBUG", plan);
    }
  }, [plan]);

  const handlePrint = async () => {
    const conteudo = document.getElementById('plano-content');
    if (!conteudo) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div style="font-family: Inter, system-ui, sans-serif; font-size: 13px; color: #1e293b; padding: 40px 48px; line-height: 1.75; background: #ffffff;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #0d9488;">
          <div style="width: 10px; height: 10px; border-radius: 9999px; background: #0d9488;"></div>
          <span style="font-size: 16px; font-weight: 700; color: #0d9488; letter-spacing: -0.3px;">Finanças Pro Invest</span>
          <span style="font-size: 11px; color: #64748b; margin-left: auto;">Plano gerado em ${new Date().toLocaleString('pt-BR')}</span>
        </div>
        ${conteudo.innerHTML}
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `plano-quitacao-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    await html2pdf().set(opt).from(wrapper).save();
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
          body * {
            visibility: hidden;
          }
          #plano-content,
          #plano-content * {
            visibility: visible;
          }
          #plano-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
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
          <>
          <div
            id="plano-content"
            className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 print:mt-0 print:space-y-3 print:animate-none print:text-black print:pb-0"
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
          
          {/* PLANO EM MARKDOWN GERADO PELO NEXUS */}
          {plan.planoMarkdown && (          
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800 print:break-inside-avoid">
              {plan.generatedAt && (
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-2">
                  Plano gerado em {new Date(plan.generatedAt).toLocaleString("pt-BR")}
                </p>
              )}    
              <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800">
                <ReactMarkdown>{plan.planoMarkdown}</ReactMarkdown>
              </div>
            </div>
          )}
          </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handlePrint}
                className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Gerar plano em PDF
              </button>
            </div>
          </>
        )}
    </div>
    </>
  );
};







