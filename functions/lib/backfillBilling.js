"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const LEGACY_PLAN_TABLE = {
    free: { tier: 'free', billingCycle: null },
    pro: { tier: 'pro', billingCycle: 'monthly' },
    pro_monthly: { tier: 'pro', billingCycle: 'monthly' },
    premium: { tier: 'premium', billingCycle: 'monthly' },
    premium_monthly: { tier: 'premium', billingCycle: 'monthly' },
    premium_annual: { tier: 'premium', billingCycle: 'annual' },
    premium_anual: { tier: 'premium', billingCycle: 'annual' },
};
function resolveLegacyPlan(planId, subActive) {
    if (!planId || planId === 'free' || !subActive) {
        return { tier: 'free', billingCycle: null };
    }
    const mapped = LEGACY_PLAN_TABLE[planId];
    if (mapped)
        return mapped;
    const match = planId.match(/^(pro|premium)/);
    if (match) {
        const tier = match[1];
        return { tier, billingCycle: 'monthly' };
    }
    return 'block';
}
async function backfill() {
    console.log('Starting backfill of billing.* from legacy subscription.*');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users`);
    let updated = 0;
    let blocked = 0;
    let errors = 0;
    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const data = userDoc.data();
        const sub = data.subscription;
        if (!sub) {
            continue;
        }
        const planId = sub.planId;
        const subStatus = sub.status;
        const currentPeriodEnd = sub.currentPeriodEnd ?? null;
        const subActive = subStatus === 'active' || subStatus === 'trialing';
        const resolved = resolveLegacyPlan(planId, subActive);
        if (resolved === 'block') {
            console.error(`BLOCKED: user ${userId} has unknown planId "${planId}" with active=${subActive}. Manual review required.`);
            blocked++;
            continue;
        }
        const { tier, billingCycle } = resolved;
        const billingStatus = subStatus === 'trialing' ? 'trialing' :
            subStatus === 'canceled' ? 'canceled' :
                subStatus === 'past_due' ? 'past_due' :
                    subActive ? 'active' : 'expired';
        try {
            const now = firestore_1.Timestamp.now();
            await db.collection('users').doc(userId).collection('billing').doc('main').set({
                tier,
                status: billingStatus,
                billingCycle,
                currentPeriodEnd: currentPeriodEnd ?? null,
                trialEnd: null,
                canceledAt: null,
                provider: null,
                providerCustomerId: null,
                providerSubscriptionId: null,
                providerPriceId: null,
                providerStatusRaw: null,
                updatedAt: now,
            });
            updated++;
            if (updated % 50 === 0) {
                console.log(`Progress: ${updated} users updated, ${blocked} blocked, ${errors} errors`);
            }
        }
        catch (err) {
            console.error(`Error updating user ${userId}:`, err);
            errors++;
        }
    }
    console.log(`Backfill complete. Updated: ${updated}, Blocked: ${blocked}, Errors: ${errors}`);
}
backfill().then(() => process.exit(0)).catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
//# sourceMappingURL=backfillBilling.js.map