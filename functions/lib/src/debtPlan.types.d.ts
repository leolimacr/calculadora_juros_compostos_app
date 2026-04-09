import { z } from "zod";
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
export type UsuarioPerfil = 'endividado_iniciante' | 'endividado_intermediario';
export type Estabilidade = 'estavel' | 'regular' | 'volatil';
export interface PerfilContexto {
    estabilidade: Estabilidade;
    reservaAtual: number;
    metaReservaEmMeses: number;
}
export interface PatrimonioContexto {
    valorTotalInvestimentosFinanceiros: number;
    valorPatrimonioLiquido?: number;
    valorDisponivelAcimaReserva?: number;
    usaReservaParaQuitar?: boolean;
}
export interface CustoOportunidadeContexto {
    selicAno?: number;
    cdiAno?: number;
    retornoLiquidoEstimadoAno?: number;
    estrategiaSugerida?: 'quitar' | 'amortizar' | 'provisionar';
    justificativaBase?: string;
}
export interface NexusDebtPlanRequest {
    usuarioPerfil?: UsuarioPerfil;
    perfilContexto?: PerfilContexto;
    patrimonioContexto?: PatrimonioContexto;
    custoOportunidadeContexto?: CustoOportunidadeContexto;
    forceRegenerate?: boolean;
    dividas: DebtItem[];
    simulacao: DebtSimulationSummary;
}
export type HorizontePasso = '7_dias' | '30_dias' | '90_dias';
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
    explicacaoCenarioAtual?: string;
    explicacaoMetaPlano?: string;
    explicacaoEsforcoMensal?: string;
    passos7Dias: ActionStep[];
    passos30Dias: ActionStep[];
    alertasImportantes: string[];
    tomGeral?: 'calmo' | 'direto' | 'motivador';
}
export declare const DebtItemSchema: z.ZodObject<{
    id: z.ZodString;
    nome: z.ZodString;
    saldoAtual: z.ZodNumber;
    taxaJurosMes: z.ZodNumber;
    parcelaMensal: z.ZodOptional<z.ZodNumber>;
    atrasoEmDias: z.ZodOptional<z.ZodNumber>;
    ehGarantida: z.ZodOptional<z.ZodBoolean>;
    observacoes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const DebtSimulationSummarySchema: z.ZodObject<{
    rendaMensalEstimada: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    totalDividas: z.ZodNumber;
    custoTotalJurosAtual: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    prazoEstimadoQuitacaoAtual: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    prazoEstimadoQuitacaoOtimizado: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    economiaEstimadaJuros: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const PerfilContextoSchema: z.ZodObject<{
    estabilidade: z.ZodEnum<{
        estavel: "estavel";
        regular: "regular";
        volatil: "volatil";
    }>;
    reservaAtual: z.ZodNumber;
    metaReservaEmMeses: z.ZodNumber;
}, z.core.$strip>;
export declare const PatrimonioContextoSchema: z.ZodObject<{
    valorTotalInvestimentosFinanceiros: z.ZodNumber;
    valorPatrimonioLiquido: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    valorDisponivelAcimaReserva: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    usaReservaParaQuitar: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const CustoOportunidadeContextoSchema: z.ZodObject<{
    selicAno: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    cdiAno: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    retornoLiquidoEstimadoAno: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    estrategiaSugerida: z.ZodOptional<z.ZodEnum<{
        quitar: "quitar";
        amortizar: "amortizar";
        provisionar: "provisionar";
    }>>;
    justificativaBase: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const NexusDebtPlanRequestSchema: z.ZodObject<{
    usuarioPerfil: z.ZodOptional<z.ZodEnum<{
        endividado_iniciante: "endividado_iniciante";
        endividado_intermediario: "endividado_intermediario";
    }>>;
    perfilContexto: z.ZodOptional<z.ZodObject<{
        estabilidade: z.ZodEnum<{
            estavel: "estavel";
            regular: "regular";
            volatil: "volatil";
        }>;
        reservaAtual: z.ZodNumber;
        metaReservaEmMeses: z.ZodNumber;
    }, z.core.$strip>>;
    patrimonioContexto: z.ZodOptional<z.ZodObject<{
        valorTotalInvestimentosFinanceiros: z.ZodNumber;
        valorPatrimonioLiquido: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        valorDisponivelAcimaReserva: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        usaReservaParaQuitar: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    custoOportunidadeContexto: z.ZodOptional<z.ZodObject<{
        selicAno: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        cdiAno: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        retornoLiquidoEstimadoAno: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        estrategiaSugerida: z.ZodOptional<z.ZodEnum<{
            quitar: "quitar";
            amortizar: "amortizar";
            provisionar: "provisionar";
        }>>;
        justificativaBase: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    forceRegenerate: z.ZodOptional<z.ZodBoolean>;
    dividas: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        nome: z.ZodString;
        saldoAtual: z.ZodNumber;
        taxaJurosMes: z.ZodNumber;
        parcelaMensal: z.ZodOptional<z.ZodNumber>;
        atrasoEmDias: z.ZodOptional<z.ZodNumber>;
        ehGarantida: z.ZodOptional<z.ZodBoolean>;
        observacoes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    simulacao: z.ZodObject<{
        rendaMensalEstimada: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        totalDividas: z.ZodNumber;
        custoTotalJurosAtual: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        prazoEstimadoQuitacaoAtual: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        prazoEstimadoQuitacaoOtimizado: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        economiaEstimadaJuros: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ActionStepSchema: z.ZodObject<{
    ordem: z.ZodNumber;
    horizonte: z.ZodEnum<{
        "7_dias": "7_dias";
        "30_dias": "30_dias";
        "90_dias": "90_dias";
    }>;
    descricao: z.ZodString;
    observacoes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PriorityExplanationSchema: z.ZodObject<{
    idDividaPrioritaria: z.ZodString;
    nomeDividaPrioritaria: z.ZodString;
    motivo: z.ZodString;
    recomendacaoPrincipal: z.ZodString;
}, z.core.$strip>;
export declare const DebtPlanResponseSchema: z.ZodObject<{
    resumo3Linhas: z.ZodArray<z.ZodString>;
    prioridade: z.ZodObject<{
        idDividaPrioritaria: z.ZodString;
        nomeDividaPrioritaria: z.ZodString;
        motivo: z.ZodString;
        recomendacaoPrincipal: z.ZodString;
    }, z.core.$strip>;
    planoHorizonte: z.ZodObject<{
        prazoEstimadoQuitacaoMeses: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        economiaEstimadaJuros: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>;
    explicacaoCenarioAtual: z.ZodOptional<z.ZodString>;
    explicacaoMetaPlano: z.ZodOptional<z.ZodString>;
    explicacaoEsforcoMensal: z.ZodOptional<z.ZodString>;
    passos7Dias: z.ZodDefault<z.ZodArray<z.ZodObject<{
        ordem: z.ZodNumber;
        horizonte: z.ZodEnum<{
            "7_dias": "7_dias";
            "30_dias": "30_dias";
            "90_dias": "90_dias";
        }>;
        descricao: z.ZodString;
        observacoes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    passos30Dias: z.ZodDefault<z.ZodArray<z.ZodObject<{
        ordem: z.ZodNumber;
        horizonte: z.ZodEnum<{
            "7_dias": "7_dias";
            "30_dias": "30_dias";
            "90_dias": "90_dias";
        }>;
        descricao: z.ZodString;
        observacoes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    alertasImportantes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tomGeral: z.ZodOptional<z.ZodEnum<{
        calmo: "calmo";
        direto: "direto";
        motivador: "motivador";
    }>>;
}, z.core.$strip>;
export type DebtPlanResponseSafe = z.infer<typeof DebtPlanResponseSchema>;
