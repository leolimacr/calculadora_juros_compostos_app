"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtPlanResponseSchema = exports.PriorityExplanationSchema = exports.ActionStepSchema = exports.NexusDebtPlanRequestSchema = exports.PerfilContextoSchema = exports.DebtSimulationSummarySchema = exports.DebtItemSchema = void 0;
const zod_1 = require("zod");
exports.DebtItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    nome: zod_1.z.string(),
    saldoAtual: zod_1.z.number(),
    taxaJurosMes: zod_1.z.number(),
    parcelaMensal: zod_1.z.number().optional(),
    atrasoEmDias: zod_1.z.number().optional(),
    ehGarantida: zod_1.z.boolean().optional(),
    observacoes: zod_1.z.string().optional(),
});
exports.DebtSimulationSummarySchema = zod_1.z.object({
    rendaMensalEstimada: zod_1.z.number().optional().nullable(),
    totalDividas: zod_1.z.number(),
    custoTotalJurosAtual: zod_1.z.number().optional().nullable(),
    prazoEstimadoQuitacaoAtual: zod_1.z.number().optional().nullable(),
    prazoEstimadoQuitacaoOtimizado: zod_1.z.number().optional().nullable(),
    economiaEstimadaJuros: zod_1.z.number().optional().nullable(),
});
exports.PerfilContextoSchema = zod_1.z.object({
    estabilidade: zod_1.z.enum(['estavel', 'regular', 'volatil']),
    reservaAtual: zod_1.z.number(),
    metaReservaEmMeses: zod_1.z.number(),
});
exports.NexusDebtPlanRequestSchema = zod_1.z.object({
    usuarioPerfil: zod_1.z.enum(['endividado_iniciante', 'endividado_intermediario']).optional(),
    perfilContexto: exports.PerfilContextoSchema.optional(),
    dividas: zod_1.z.array(exports.DebtItemSchema).min(1),
    simulacao: exports.DebtSimulationSummarySchema,
});
exports.ActionStepSchema = zod_1.z.object({
    ordem: zod_1.z.number().int().nonnegative(),
    horizonte: zod_1.z.enum(['7_dias', '30_dias', '90_dias']),
    descricao: zod_1.z.string().min(3),
    observacoes: zod_1.z.string().optional(),
});
exports.PriorityExplanationSchema = zod_1.z.object({
    idDividaPrioritaria: zod_1.z.string(),
    nomeDividaPrioritaria: zod_1.z.string(),
    motivo: zod_1.z.string().min(3),
    recomendacaoPrincipal: zod_1.z.string().min(3),
});
exports.DebtPlanResponseSchema = zod_1.z.object({
    resumo3Linhas: zod_1.z.array(zod_1.z.string()).min(1),
    prioridade: exports.PriorityExplanationSchema,
    planoHorizonte: zod_1.z.object({
        prazoEstimadoQuitacaoMeses: zod_1.z.number().nullable().optional(),
        economiaEstimadaJuros: zod_1.z.number().nullable().optional(),
    }),
    passos7Dias: zod_1.z.array(exports.ActionStepSchema).default([]),
    passos30Dias: zod_1.z.array(exports.ActionStepSchema).default([]),
    alertasImportantes: zod_1.z.array(zod_1.z.string()).default([]),
    tomGeral: zod_1.z.enum(['calmo', 'direto', 'motivador']).optional(),
});
//# sourceMappingURL=debtPlan.types.js.map