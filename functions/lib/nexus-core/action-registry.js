"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionManager = exports.ACTION_REGISTRY = void 0;
exports.ACTION_REGISTRY = {
    'NAV_DEBTS': {
        id: 'NAV_DEBTS',
        label: 'Ver minhas dívidas',
        route: '/dividas',
        icon: 'credit_card'
    },
    'NAV_RESERVE': {
        id: 'NAV_RESERVE',
        label: 'Configurar reserva',
        route: '/reserva',
        icon: 'shield'
    },
    'NAV_CASHFLOW': {
        id: 'NAV_CASHFLOW',
        label: 'Ver extrato',
        route: '/extrato',
        icon: 'account_balance'
    }
};
class ActionManager {
    static extractActions(text) {
        const actionRegex = /\[ACTION:(.*?)\]/g;
        const foundActions = [];
        const cleanText = text.replace(actionRegex, (match, actionId) => {
            const id = actionId.trim();
            if (exports.ACTION_REGISTRY[id]) {
                foundActions.push(exports.ACTION_REGISTRY[id]);
            }
            return '';
        }).trim();
        return {
            cleanText,
            actions: foundActions
        };
    }
    static getInstructionMenu() {
        return `
# 🛠️ CONTEXTUAL ACTIONS (PROTOCOLO OBRIGATÓRIO)
Se o seu diagnóstico sugerir uma ação direta do usuário, você DEVE incluir exatamente UMA tag de ação ao final da resposta.
Use apenas os IDs permitidos abaixo. NUNCA invente novos IDs ou rotas.

Ações Permitidas:
- Se sugerir revisar/ver dívidas: [ACTION:NAV_DEBTS]
- Se sugerir configurar/ver reserva: [ACTION:NAV_RESERVE]
- Se sugerir ver extrato/lançamentos: [ACTION:NAV_CASHFLOW]

Exemplo de uso:
"Recomendo que você priorize a quitação desta dívida. [ACTION:NAV_DEBTS]"
`;
    }
}
exports.ActionManager = ActionManager;
//# sourceMappingURL=action-registry.js.map