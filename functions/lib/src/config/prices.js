"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePriceMapping = resolvePriceMapping;
exports.determineBillingCycle = determineBillingCycle;
const PRICE_MAP_TEST = {
    price_pro_test: { tier: 'pro', billingCycle: 'monthly' },
    price_premium_test: { tier: 'premium', billingCycle: 'monthly' },
    price_premium_annual_test: { tier: 'premium', billingCycle: 'annual' },
};
const PRICE_MAP_PROD = {
    price_pro_prod: { tier: 'pro', billingCycle: 'monthly' },
    price_premium_prod: { tier: 'premium', billingCycle: 'monthly' },
    price_premium_annual_prod: { tier: 'premium', billingCycle: 'annual' },
};
function resolvePriceMapping(priceId) {
    return PRICE_MAP_TEST[priceId] ?? PRICE_MAP_PROD[priceId] ?? null;
}
function determineBillingCycle(priceId) {
    const mapping = resolvePriceMapping(priceId);
    return mapping?.billingCycle ?? 'monthly';
}
//# sourceMappingURL=prices.js.map