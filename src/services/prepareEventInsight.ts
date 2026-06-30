import type { NexusInsight } from './nexusInsightEngine';
import { getPersonaVoice } from './personaService';
import type { Archetype } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  }
  return result;
}

const KNOWN_VARS = ['value', 'diff', 'jump', 'amount', 'newSaldo', 'previousSaldo'];

export function prepareEventInsight(
  raw: NexusInsight,
  templateVars: Record<string, number>,
  archetype: Archetype = 'guardian',
): NexusInsight {
  const voice = getPersonaVoice(archetype);

  const formatted: Record<string, string> = {};
  for (const [key, num] of Object.entries(templateVars)) {
    if (KNOWN_VARS.includes(key)) {
      formatted[key] = fmt(num);
    } else {
      formatted[key] = String(num);
    }
  }
  formatted.prefix = voice.prefix;

  return {
    ...raw,
    message: {
      ...raw.message,
      body: interpolate(raw.message.body, formatted),
    },
    style: { brandColor: voice.color },
  };
}
