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
}

export const DebtPlanSimulator: React.FC<DebtPlanSimulatorProps> = ({
  dividas,
  simulacao,
  usuarioPerfil,
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
        <div id="plano-content" className="mt-6 space-y-5">
          {/* Resumo em até 3 linhas */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700">
              Resumo do plano
            </h3>
            <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-1">
              {plan.resumo3Linhas.map((linha, idx) => (
                <li key={idx}>{linha}</li>
              ))}
            </ul>
          </section>

          {/* Prioridade principal */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700">
              Dívida prioritária
            </h3>
            <div className="mt-2 text-sm text-slate-600 space-y-1">
              <p>
                <span className="font-semibold">
                  {plan.prioridade.nomeDividaPrioritaria}
                </span>
              </p>
              <p>
                <span className="font-semibold">Motivo:</span> {plan.prioridade.motivo}
              </p>
              <p>
                <span className="font-semibold">Recomendação principal:</span>{" "}
                {plan.prioridade.recomendacaoPrincipal}
              </p>
            </div>
          </section>

          {/* Horizonte de quitação */}
          {(plan.planoHorizonte?.prazoEstimadoQuitacaoMeses != null ||
            plan.planoHorizonte?.economiaEstimadaJuros != null) && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">
                Horizonte de quitação
              </h3>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                {plan.planoHorizonte.prazoEstimadoQuitacaoMeses != null && (
                  <p>
                    Prazo estimado para ficar livre das dívidas:{" "}
                    <span className="font-semibold">
                      {plan.planoHorizonte.prazoEstimadoQuitacaoMeses} meses
                    </span>
                  </p>
                )}
                {plan.planoHorizonte.economiaEstimadaJuros != null && (
                  <p>
                    Economia estimada em juros, se seguir o plano:{" "}
                    <span className="font-semibold">
                      R$ {plan.planoHorizonte.economiaEstimadaJuros.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Passos 7 dias */}
          {plan.passos7Dias && plan.passos7Dias.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">
                Próximos 7 dias
              </h3>
              <ol className="mt-2 text-sm text-slate-600 list-decimal list-inside space-y-1">
                {plan.passos7Dias.map((step) => (
                  <li key={step.ordem}>
                    <span className="font-semibold">{step.descricao}</span>
                    {step.observacoes && (
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Observação: {step.observacoes}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Passos 30 dias */}
          {plan.passos30Dias && plan.passos30Dias.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">
                Próximos 30 dias
              </h3>
              <ol className="mt-2 text-sm text-slate-600 list-decimal list-inside space-y-1">
                {plan.passos30Dias.map((step) => (
                  <li key={step.ordem}>
                    <span className="font-semibold">{step.descricao}</span>
                    {step.observacoes && (
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Observação: {step.observacoes}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Alertas importantes */}
          {plan.alertasImportantes && plan.alertasImportantes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">
                Alertas importantes
              </h3>
              <ul className="mt-2 text-sm text-rose-700 list-disc list-inside space-y-1">
                {plan.alertasImportantes.map((alerta, idx) => (
                  <li key={idx}>{alerta}</li>
                ))}
              </ul>
            </section>
          )}
          {/* Botão para gerar PDF */}
          <div className="mt-8 pt-4 border-t border-slate-200">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              📄 Gerar plano em PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};