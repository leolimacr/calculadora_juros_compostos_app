"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPortalSession = exports.expireCanceledSubscriptions = exports.createCheckoutSession = exports.handleStripeWebhook = exports.getMarketData = exports.getAssetQuote = exports.monthlyRotativoInterest = exports.dailyPresenceCheck = exports.generateDebtPlan = exports.testMistral = exports.askAiAdvisor = void 0;
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
var askAiAdvisor_1 = require("./askAiAdvisor");
Object.defineProperty(exports, "askAiAdvisor", { enumerable: true, get: function () { return askAiAdvisor_1.askAiAdvisor; } });
Object.defineProperty(exports, "testMistral", { enumerable: true, get: function () { return askAiAdvisor_1.testMistral; } });
var generateDebtPlan_1 = require("./generateDebtPlan");
Object.defineProperty(exports, "generateDebtPlan", { enumerable: true, get: function () { return generateDebtPlan_1.generateDebtPlan; } });
var presenceCheck_1 = require("./presenceCheck");
Object.defineProperty(exports, "dailyPresenceCheck", { enumerable: true, get: function () { return presenceCheck_1.dailyPresenceCheck; } });
var monthlyRotativo_1 = require("./monthlyRotativo");
Object.defineProperty(exports, "monthlyRotativoInterest", { enumerable: true, get: function () { return monthlyRotativo_1.monthlyRotativoInterest; } });
var getAssetQuote_1 = require("./getAssetQuote");
Object.defineProperty(exports, "getAssetQuote", { enumerable: true, get: function () { return getAssetQuote_1.getAssetQuote; } });
var marketData_1 = require("./marketData");
Object.defineProperty(exports, "getMarketData", { enumerable: true, get: function () { return marketData_1.getMarketData; } });
var handleStripeWebhook_1 = require("./handleStripeWebhook");
Object.defineProperty(exports, "handleStripeWebhook", { enumerable: true, get: function () { return handleStripeWebhook_1.handleStripeWebhook; } });
var createCheckoutSession_1 = require("./createCheckoutSession");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return createCheckoutSession_1.createCheckoutSession; } });
var schedulerExpireCanceled_1 = require("./schedulerExpireCanceled");
Object.defineProperty(exports, "expireCanceledSubscriptions", { enumerable: true, get: function () { return schedulerExpireCanceled_1.expireCanceledSubscriptions; } });
var createPortalSession_1 = require("./createPortalSession");
Object.defineProperty(exports, "createPortalSession", { enumerable: true, get: function () { return createPortalSession_1.createPortalSession; } });
//# sourceMappingURL=index.js.map