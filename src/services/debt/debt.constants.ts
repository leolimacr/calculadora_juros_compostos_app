export const MANUAL_DEBT_TYPES = {
  ROTATIVO: 'Cartão rotativo',
  PESSOAL: 'Empréstimo pessoal',
  FINANCIAMENTO: 'Financiamento',
  CHEQUE_ESPECIAL: 'Cheque especial',
  CONSIGNADO: 'Crédito consignado',
  OUTRO: 'Outro',
} as const;

export const MANUAL_DEBT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: MANUAL_DEBT_TYPES.ROTATIVO, label: 'Fatura de Cartão / Crédito rotativo' },
  { value: MANUAL_DEBT_TYPES.PESSOAL, label: 'Empréstimo pessoal' },
  { value: MANUAL_DEBT_TYPES.FINANCIAMENTO, label: 'Financiamento' },
  { value: MANUAL_DEBT_TYPES.CHEQUE_ESPECIAL, label: 'Cheque especial' },
  { value: MANUAL_DEBT_TYPES.CONSIGNADO, label: 'Crédito consignado' },
  { value: MANUAL_DEBT_TYPES.OUTRO, label: 'Outro' },
];
