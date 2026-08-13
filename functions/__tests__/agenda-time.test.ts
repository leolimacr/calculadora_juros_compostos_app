import { describe, expect, it } from 'vitest';
import {
  expandRecurrence,
  resolveDateExpression,
  todayYmdInProductTimezone,
  type YMD,
} from '../nexus-core/agenda-time';

const TODAY: YMD = { y: 2026, m0: 7, d: 12 };

function resolve(raw: string) {
  return resolveDateExpression(raw, TODAY);
}

describe('resolveDateExpression — fim de período / mês', () => {
  it('resolve "fim de setembro" para o último dia do mês', () => {
    expect(resolve('fim de setembro')).toEqual({ iso: '2026-09-30', confidence: 'high' });
  });

  it('resolve "o fim de setembro" com artigo', () => {
    expect(resolve('o fim de setembro')).toEqual({ iso: '2026-09-30', confidence: 'high' });
  });

  it('resolve "até o fim de setembro" (prefixo até)', () => {
    expect(resolve('até o fim de setembro')).toEqual({ iso: '2026-09-30', confidence: 'high' });
  });

  it('resolve "fim de setembro de 2026" com ano explícito', () => {
    expect(resolve('fim de setembro de 2026')).toEqual({ iso: '2026-09-30', confidence: 'high' });
  });

  it('resolve "fim de dezembro de 2026" cruzando ano', () => {
    expect(resolve('fim de dezembro de 2026')).toEqual({ iso: '2026-12-31', confidence: 'high' });
  });

  it('resolve "até dezembro" para o fim de dezembro', () => {
    expect(resolve('até dezembro')).toEqual({ iso: '2026-12-31', confidence: 'high' });
  });

  it('resolve "fim do mês" para o último dia do mês corrente', () => {
    expect(resolve('fim do mês')).toEqual({ iso: '2026-08-31', confidence: 'high' });
  });

  it('resolve "fim do mês que vem" para o próximo mês', () => {
    expect(resolve('fim do mês que vem')).toEqual({ iso: '2026-09-30', confidence: 'high' });
  });
});

describe('resolveDateExpression — dias da semana (singular e plural)', () => {
  it('mantém "toda terça-feira" como próxima terça', () => {
    expect(resolve('toda terça-feira')).toEqual({ iso: '2026-08-18', confidence: 'high' });
  });

  it('resolve "toda terça feira" sem hífen', () => {
    expect(resolve('toda terça feira')).toEqual({ iso: '2026-08-18', confidence: 'high' });
  });

  it('resolve o plural "todas as terças"', () => {
    expect(resolve('todas as terças')).toEqual({ iso: '2026-08-18', confidence: 'high' });
  });

  it('resolve o plural "todas as terças-feiras"', () => {
    expect(resolve('todas as terças-feiras')).toEqual({ iso: '2026-08-18', confidence: 'high' });
  });

  it('resolve "terças que vem"', () => {
    expect(resolve('terças que vem')).toEqual({ iso: '2026-08-18', confidence: 'high' });
  });

  it('mantém "próxima quinta" e datas absolutas intactos', () => {
    expect(resolve('próxima quinta')).toEqual({ iso: '2026-08-13', confidence: 'high' });
    expect(resolve('25/08')).toEqual({ iso: '2026-08-25', confidence: 'high' });
  });

  it('mantém "última terça-feira de novembro de 2026"', () => {
    expect(resolve('última terça-feira de novembro de 2026')).toEqual({ iso: '2026-11-24', confidence: 'high' });
  });
});

describe('expandRecurrence — série de terças até o fim de setembro', () => {
  it('gera exatamente as 7 terças de 18/08 a 29/09', () => {
    const expanded = expandRecurrence({ freq: 'weekly', startIso: '2026-08-18', untilIso: '2026-09-30' });
    expect(expanded.occurrences).toEqual([
      '2026-08-18',
      '2026-08-25',
      '2026-09-01',
      '2026-09-08',
      '2026-09-15',
      '2026-09-22',
      '2026-09-29',
    ]);
    expect(expanded.first).toBe('2026-08-18');
    expect(expanded.last).toBe('2026-09-29');
    expect(expanded.truncated).toBe(false);
  });

  it('mantém fuso de produto estável', () => {
    expect(todayYmdInProductTimezone(new Date('2026-08-12T15:00:00.000Z'))).toEqual({ y: 2026, m0: 7, d: 12 });
  });
});