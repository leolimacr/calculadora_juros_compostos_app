import { describe, it, expect } from 'vitest';
import type { NexusInsight } from '../nexusInsightEngine';
import { prepareEventInsight } from '../prepareEventInsight';

function makeRaw(overrides: Partial<NexusInsight> = {}): NexusInsight {
  return {
    id: 'test',
    message: { title: 'T', body: '{prefix} Valor: {value}', ctaLabel: 'C' },
    deepLink: 'home',
    priority: 'media',
    ...overrides,
  };
}

describe('prepareEventInsight', () => {
  it('replaces {prefix} with guardian voice prefix by default', () => {
    const result = prepareEventInsight(makeRaw(), { value: 1000 });
    expect(result.message.body).toContain('Status: Protegido.');
    expect(result.message.body).toMatch(/R\$\s*1\.000,00/);
  });

  it('replaces {prefix} with resilient voice when archetype is resilient', () => {
    const result = prepareEventInsight(makeRaw(), { value: 1000 }, 'resilient');
    expect(result.message.body).toContain('Status: Crítico.');
  });

  it('replaces {prefix} with commander voice', () => {
    const result = prepareEventInsight(makeRaw(), { value: 1000 }, 'commander');
    expect(result.message.body).toContain('Status: Comando.');
  });

  it('formats currency vars correctly', () => {
    const result = prepareEventInsight(makeRaw(), { value: 2500 });
    expect(result.message.body).toMatch(/R\$\s*2\.500,00/);
  });

  it('formats multiple numeric vars', () => {
    const raw = makeRaw({
      message: { title: 'T', body: '{prefix} Abatidos {amount}. Restante: {newSaldo} (de {previousSaldo})', ctaLabel: 'C' },
    });
    const result = prepareEventInsight(raw, { amount: 500, newSaldo: 2000, previousSaldo: 2500 });
    expect(result.message.body).toMatch(/R\$\s*500,00/);
    expect(result.message.body).toMatch(/R\$\s*2\.000,00/);
    expect(result.message.body).toMatch(/R\$\s*2\.500,00/);
  });

  it('sets style.brandColor from voice', () => {
    const guardian = prepareEventInsight(makeRaw(), { value: 100 });
    expect(guardian.style?.brandColor).toBe('#10b981');

    const resilient = prepareEventInsight(makeRaw(), { value: 100 }, 'resilient');
    expect(resilient.style?.brandColor).toBe('#f43f5e');

    const commander = prepareEventInsight(makeRaw(), { value: 100 }, 'commander');
    expect(commander.style?.brandColor).toBe('#0ea5e9');
  });

  it('preserves other insight fields', () => {
    const result = prepareEventInsight(makeRaw({
      id: 'my-id',
      message: { title: 'Title', body: '{prefix} Test {value}', ctaLabel: 'Go' },
      deepLink: 'home',
      priority: 'alta',
    }), { value: 500 });
    expect(result.id).toBe('my-id');
    expect(result.message.title).toBe('Title');
    expect(result.message.ctaLabel).toBe('Go');
    expect(result.deepLink).toBe('home');
    expect(result.priority).toBe('alta');
  });

  it('handles {diff} var', () => {
    const raw = makeRaw({
      message: { title: 'T', body: '{prefix} Diferença: {diff}', ctaLabel: 'C' },
    });
    const result = prepareEventInsight(raw, { diff: 1500 });
    expect(result.message.body).toMatch(/R\$\s*1\.500,00/);
  });

  it('handles {jump} var', () => {
    const raw = makeRaw({
      message: { title: 'T', body: '{prefix} Salto: {jump}', ctaLabel: 'C' },
    });
    const result = prepareEventInsight(raw, { jump: 2000 });
    expect(result.message.body).toMatch(/R\$\s*2\.000,00/);
  });
});
