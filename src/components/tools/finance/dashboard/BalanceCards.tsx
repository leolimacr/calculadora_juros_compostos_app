import React, { useMemo } from 'react';
import { maskCurrency, calculatePreviousMonthClose } from '../../../../utils/calculations';
import { useExclusions } from '../../../../contexts/ExclusionsContext';
import { FinanceLine, FinanceTotal, FinanceCheckLine } from './FinanceLine';

interface VoucherCardInfo {
  id: string;
  name: string;
  balance: number;
}

interface BalanceCardsProps {
  isPrivacyMode: boolean;
  saldoReal: number | null;
  receitasMes: number | null;
  despesasMes: number | null;
  reserveTarget: number;
  colchaoTarget: number;
  voucherCards: VoucherCardInfo[];
  transactions: any[];
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const BalanceCards: React.FC<BalanceCardsProps> = ({
  isPrivacyMode,
  saldoReal,
  receitasMes,
  despesasMes,
  reserveTarget,
  colchaoTarget,
  voucherCards,
  transactions,
}) => {
  const { excluirReserva, excluirColchao, excluirVoucherMap, toggleReserva, toggleColchao, toggleVoucherCard, computeExclusions } = useExclusions();
  const fmt = (n: number) => (isPrivacyMode ? '••••••' : maskCurrency(n));

  // Loading skeleton — exibido até os dados do mês corrente estarem carregados
  if (saldoReal === null) {
    return (
      <div className="bg-surface-primary border border-border-strong rounded-panel p-5 shadow-panel border-l-4 border-l-brand-primary/40 animate-pulse">
        <div className="h-3 w-24 bg-surface-secondary rounded-full mb-3" />
        <div className="h-4 w-16 bg-surface-secondary rounded-full mb-1" />
        <div className="h-8 w-36 bg-surface-secondary rounded-xl mt-4" />
        <div className="border-t border-surface-elevated pt-3 mt-4 space-y-2">
          <div className="flex justify-between"><div className="h-3 w-28 bg-surface-secondary rounded-full" /><div className="h-4 w-20 bg-surface-secondary rounded-full" /></div>
          <div className="flex justify-between"><div className="h-3 w-24 bg-surface-secondary rounded-full" /><div className="h-4 w-20 bg-surface-secondary rounded-full" /></div>
          <div className="flex justify-between"><div className="h-3 w-32 bg-surface-secondary rounded-full" /><div className="h-4 w-20 bg-surface-secondary rounded-full" /></div>
        </div>
      </div>
    );
  }

  const exclusaoTotal = computeExclusions(reserveTarget, colchaoTarget, voucherCards);
  const saldoDisplay = saldoReal - exclusaoTotal;
  const isNegative = saldoDisplay < 0;
  const hasExclusao = excluirReserva || excluirColchao || Object.values(excluirVoucherMap).some(Boolean);

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  const labelAnterior = `${MESES[mesAnterior]}/${anoAnterior}`;
  const labelAtual = `${MESES[mesAtual]}/${anoAtual}`;

  const saldoAnterior = calculatePreviousMonthClose(transactions, new Date());

  return (
    <div className="bg-surface-primary border border-border-strong rounded-panel p-5 shadow-panel border-l-4 border-l-brand-primary/40">
      <div className="flex flex-col gap-4">
        {/* Título */}
        <h2 className="text-sm font-black text-text-primary tracking-tight">
          Saldo Atual
        </h2>
        <p className="text-[10px] text-text-muted font-medium -mt-2 leading-relaxed">
          Dinheiro que realmente está na sua conta bancária hoje.
          <span className="block mt-0.5 text-[9px] text-text-muted italic">
            Reflete o fluxo de caixa efetivado em conta: receitas menos despesas à vista e pagamentos de cartão. Compras no cartão de crédito e obrigações a prazo não são deduzidas aqui.
          </span>
        </p>

        {/* Valor principal */}
        <div className="flex items-baseline justify-between">
          <h2
            className={`text-3xl font-black tabular-nums tracking-tight ${
              isNegative ? 'text-status-danger' : 'text-text-primary'
            }`}
          >
            {fmt(saldoDisplay)}
          </h2>
        </div>

        {/* Decomposição mensal */}
        <div className="border-t border-surface-elevated pt-1" role="group" aria-label="Decomposição do saldo: Saldo anterior + Receitas do mês − Despesas do mês = Saldo Atual">
          <FinanceLine
            label={`Saldo anterior de ${labelAnterior}`}
            value={fmt(saldoAnterior)}
          />
          <FinanceLine
            label={`Receitas de ${labelAtual}`}
            value={`+ ${fmt(receitasMes ?? 0)}`}
            tone="positive"
          />
          <FinanceLine
            label={`Despesas já pagas de ${labelAtual}`}
            hint="Compras feitas no cartão de crédito não entram nas despesas — apenas os pagamentos das faturas estão neste total."
            value={`− ${fmt(despesasMes ?? 0)}`}
            tone="negative"
          />

          {/* Checkboxes de exclusão */}
          <div className="pt-1">
            <FinanceCheckLine
              checked={excluirReserva}
              onChange={toggleReserva}
              title="Retirar minha reserva de emergência"
              hint={`Simulação: ${fmt(reserveTarget)} abatidos do SALDO ATUAL. Valor separado para proteção — não é despesa do mês.`}
              value={fmt(reserveTarget)}
            />
            <FinanceCheckLine
              checked={excluirColchao}
              onChange={toggleColchao}
              title="Retirar o meu Colchão emergencial"
              hint={`Simulação: ${fmt(colchaoTarget)} abatidos do SALDO ATUAL. Valor separado para proteção — não é despesa do mês.`}
              value={fmt(colchaoTarget)}
            />
            {voucherCards.filter(c => c.balance > 0).map(card => (
              <FinanceCheckLine
                key={card.id}
                checked={!!excluirVoucherMap[card.id]}
                onChange={() => toggleVoucherCard(card.id)}
                title={`Retirar o saldo do Cartão Voucher (${card.name})`}
                hint="Simulação: valor abatido do SALDO ATUAL."
                value={fmt(card.balance)}
              />
            ))}
          </div>

          <FinanceTotal
            label={hasExclusao ? 'Saldo Atual (com exclusões)' : 'Saldo Atual'}
            value={fmt(saldoDisplay)}
            tone={isNegative ? 'negative' : 'neutral'}
          />
        </div>

        {/* Nota explicativa */}
        <p className="text-[9px] text-text-muted font-medium leading-relaxed">
          O saldo do fechamento de {labelAnterior} forma o saldo atual de {labelAtual}.
          <span className="block mt-0.5 text-text-muted">
            O Extrato / filtragem geral inclui o fluxo bruto (todas as despesas), enquanto o Saldo Atual reflete apenas o fluxo de caixa efetivado em conta.
          </span>
        </p>
      </div>
    </div>
  );
};

export default BalanceCards;
