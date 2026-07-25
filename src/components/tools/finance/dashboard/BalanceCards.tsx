import React from 'react';
import { maskCurrency } from '../../../../utils/calculations';

interface VoucherCardInfo {
  id: string;
  name: string;
  balance: number;
}

interface BalanceCardsProps {
  isPrivacyMode: boolean;
  saldoReal: number;
  receitasMes: number;
  despesasMes: number;
  reserveTarget: number;
  colchaoTarget: number;
  excluirReserva: boolean;
  excluirColchao: boolean;
  onToggleReserva: () => void;
  onToggleColchao: () => void;
  voucherCards: VoucherCardInfo[];
  excluirVoucherMap: Record<string, boolean>;
  onToggleVoucherCard: (cardId: string) => void;
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
  excluirReserva,
  excluirColchao,
  onToggleReserva,
  onToggleColchao,
  voucherCards,
  excluirVoucherMap,
  onToggleVoucherCard,
}) => {
  const fmt = (n: number) => (isPrivacyMode ? '••••••' : maskCurrency(n));

  const exclusaoVoucher = voucherCards
    .filter(c => excluirVoucherMap[c.id])
    .reduce((s, c) => s + c.balance, 0);
  const exclusaoTotal = (excluirReserva ? reserveTarget : 0) + (excluirColchao ? colchaoTarget : 0) + exclusaoVoucher;
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

  const saldoAnterior = saldoReal - receitasMes + despesasMes - exclusaoTotal;

  return (
    <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-card border-l-4 border-l-brand-primary/40">
      <div className="flex flex-col gap-4">
        {/* Título */}
        <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">
          Saldo Atual
        </p>
        <p className="text-[10px] text-text-muted font-medium -mt-2 leading-relaxed">
          Dinheiro que realmente está na sua conta bancária hoje.
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
        <div className="border-t border-surface-elevated pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">
              Saldo anterior de {labelAnterior}
            </span>
            <span className="text-sm font-black tabular-nums">
              {fmt(saldoAnterior)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">
              Receitas de {labelAtual}
            </span>
            <span className="text-sm font-black text-brand-primary tabular-nums">
              + {fmt(receitasMes)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">
              Despesas já pagas de {labelAtual}
            </span>
            <span className="text-sm font-black text-status-danger tabular-nums">
              − {fmt(despesasMes)}
            </span>
          </div>
          <p className="text-[9px] text-text-muted/80 font-medium leading-relaxed -mt-1 mb-2">
            Compras feitas no cartão de crédito não entram nas despesas — apenas os pagamentos das faturas estão neste total.
          </p>

          {/* Checkboxes de exclusão */}
          <div className="pt-1 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={excluirReserva}
                onChange={onToggleReserva}
                className="mt-0.5 h-3.5 w-3.5 rounded border-surface-elevated text-brand-primary focus:ring-brand-primary/30"
              />
              <span className="text-[10px] leading-snug text-text-muted group-hover:text-text-primary transition-colors">
                Retirar minha reserva de emergência no valor de <strong className="text-text-primary">{fmt(reserveTarget)}</strong> do SALDO ATUAL
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={excluirColchao}
                onChange={onToggleColchao}
                className="mt-0.5 h-3.5 w-3.5 rounded border-surface-elevated text-brand-primary focus:ring-brand-primary/30"
              />
              <span className="text-[10px] leading-snug text-text-muted group-hover:text-text-primary transition-colors">
                Retirar o meu Colchão emergencial no valor de <strong className="text-text-primary">{fmt(colchaoTarget)}</strong> do SALDO ATUAL
              </span>
            </label>
            {voucherCards.filter(c => c.balance > 0).map(card => (
              <label key={card.id} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!excluirVoucherMap[card.id]}
                  onChange={() => onToggleVoucherCard(card.id)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-surface-elevated text-emerald-600 focus:ring-emerald-400/30"
                />
                <span className="text-[10px] leading-snug text-text-muted group-hover:text-text-primary transition-colors">
                  Retirar o saldo do Cartão Voucher (<strong className="text-text-primary">{card.name}</strong>) no valor de <strong className="text-emerald-600">{fmt(card.balance)}</strong> do SALDO ATUAL
                </span>
              </label>
            ))}
          </div>

          <div className="border-t border-surface-elevated pt-2 flex justify-between items-center">
            <span className="text-xs font-black text-text-primary uppercase tracking-ultra-wide">
              {hasExclusao ? 'Saldo Atual (com exclusões)' : 'Saldo Atual'}
            </span>
            <span
              className={`text-lg font-black tabular-nums ${
                isNegative ? 'text-status-danger' : 'text-text-primary'
              }`}
            >
              {fmt(saldoDisplay)}
            </span>
          </div>
        </div>

        {/* Nota explicativa */}
        <p className="text-[9px] text-text-muted font-medium leading-relaxed">
          O saldo do fechamento de {labelAnterior} forma o saldo atual de {labelAtual}.
        </p>
      </div>
    </div>
  );
};

export default BalanceCards;
