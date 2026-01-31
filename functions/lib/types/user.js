"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAppPremium = exports.hasPremiumAccess = exports.hasProAccess = exports.getUserPlan = void 0;
// --- Helpers ---
const getUserPlan = (userDoc) => {
    return userDoc?.plan || 'free';
};
exports.getUserPlan = getUserPlan;
const hasProAccess = (plan) => {
    return plan === 'pro' || plan === 'premium';
};
exports.hasProAccess = hasProAccess;
const hasPremiumAccess = (plan) => {
    return plan === 'premium';
};
exports.hasPremiumAccess = hasPremiumAccess;
const isAppPremium = (user) => {
    if (!user)
        return false;
    return (0, exports.hasProAccess)(user.plan || 'free') || !!user.access?.app_premium || !!user.access?.site_premium;
};
exports.isAppPremium = isAppPremium;
//# sourceMappingURL=user.js.map