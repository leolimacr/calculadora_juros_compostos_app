export interface PriceMapping {
    tier: 'free' | 'pro' | 'premium';
    billingCycle: 'monthly' | 'annual';
}
export declare function resolvePriceMapping(priceId: string): PriceMapping | null;
export declare function determineBillingCycle(priceId: string): 'monthly' | 'annual';
