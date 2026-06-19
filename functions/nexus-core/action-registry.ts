/**
 * ACTION REGISTRY - Catálogo Canônico de Ações Contextuais do Nexus
 * Garante que o modelo não invente rotas ou payloads inválidos.
 */

export interface ContextualAction {
  id: string;
  label: string;
  route: string;
  icon?: string;
}

export const ACTION_REGISTRY: Record<string, ContextualAction> = {
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

export class ActionManager {
  /**
   * Extrai e valida ações de uma string de resposta.
   * Formato esperado: [ACTION:ID]
   */
  static extractActions(text: string): { cleanText: string; actions: ContextualAction[] } {
    const actionRegex = /\[ACTION:(.*?)\]/g;
    const foundActions: ContextualAction[] = [];
    
    const cleanText = text.replace(actionRegex, (match, actionId) => {
      const id = actionId.trim();
      if (ACTION_REGISTRY[id]) {
        foundActions.push(ACTION_REGISTRY[id]);
      }
      return ''; // Remove a tag do texto final
    }).trim();

    return {
      cleanText,
      actions: foundActions
    };
  }

  /**
   * Retorna o menu de instruções para o PromptBuilder.
   */
  static getInstructionMenu(): string {
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
