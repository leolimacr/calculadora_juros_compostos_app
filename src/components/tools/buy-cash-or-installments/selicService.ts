import { SelicApiResponseItem } from './types';

const SELIC_SERIES_CODE = 432;

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export async function fetchCurrentSelicRate(): Promise<number> {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);

  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SELIC_SERIES_CODE}/dados?formato=json&dataInicial=${formatDate(start)}&dataFinal=${formatDate(end)}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar a Selic automática no momento.');
  }

  const data = (await response.json()) as SelicApiResponseItem[];
  const last = data[data.length - 1];

  if (!last?.valor) {
    throw new Error('A resposta da API do Banco Central veio sem valor da Selic.');
  }

  return Number(last.valor.replace(',', '.'));
}