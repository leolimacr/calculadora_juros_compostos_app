// src/services/nexusDebtPlanClient.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // ajuste o caminho conforme seu setup

// Mesmos tipos do backend, simplificados para o front
export interface DebtItem {
  id: string;
  nome: string;
  saldoAtual: number;
  taxaJurosMes: number;
  parcelaMensal?: number;
  atrasoEmDias?: number;
  ehGarantida?: boolean;
  observacoes?: string;
}

export interface DebtSimulationSummary {
  rendaMensalEstimada?: number;
  totalDividas: number;
  custoTotalJurosAtual?: number;
  prazoEstimadoQuitacaoAtual?: number;
  prazoEstimadoQuitacaoOtimizado?: number;
  economiaEstimadaJuros?: number;
}

export type UsuarioPerfil = "endividado_iniciante" | "endividado_intermediario";

export interface NexusDebtPlanRequest {
  usuarioPerfil?: UsuarioPerfil;
  dividas: DebtItem[];
  simulacao: DebtSimulationSummary;
}

export type HorizontePasso = "7_dias" | "30_dias" | "90_dias";

export interface ActionStep {
  ordem: number;
  horizonte: HorizontePasso;
  descricao: string;
  observacoes?: string;
}

export interface PriorityExplanation {
  idDividaPrioritaria: string;
  nomeDividaPrioritaria: string;
  motivo: string;
  recomendacaoPrincipal: string;
}

export interface DebtPlanResponse {
  resumo3Linhas: string[];
  prioridade: PriorityExplanation;
  planoHorizonte: {
    prazoEstimadoQuitacaoMeses?: number | null;
    economiaEstimadaJuros?: number | null;
  };
  passos7Dias: ActionStep[];
  passos30Dias: ActionStep[];
  alertasImportantes: string[];
  tomGeral?: "calmo" | "direto" | "motivador";
}

interface GenerateDebtPlanCallableResponse {
  success: boolean;
  plan?: DebtPlanResponse;
  model?: string;
  provider?: string;
}

/**
 * Chama a Cloud Function generateDebtPlan com os dados do simulador.
 */
export async function callGenerateDebtPlan(
  payload: NexusDebtPlanRequest
): Promise<DebtPlanResponse> {

  const fn = httpsCallable<NexusDebtPlanRequest, GenerateDebtPlanCallableResponse>(
    functions,
    "generateDebtPlan"
  );

  const result = await fn(payload);
  const data = result.data;

  if (!data || !data.success || !data.plan) {
    throw new Error("Falha ao gerar plano de quitação. Tente novamente.");
  }

  return data.plan;
}