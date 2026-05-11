process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

import { initializeApp } from 'firebase-admin/app';
initializeApp();

export { askAiAdvisor, testMistral } from './askAiAdvisor';
export { generateDebtPlan } from './generateDebtPlan';
export { dailyPresenceCheck } from './presenceCheck';
export { getAssetQuote } from './getAssetQuote';
export { getMarketData } from './marketData';