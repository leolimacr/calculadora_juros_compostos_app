"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketData = exports.getAssetQuote = exports.dailyPresenceCheck = exports.generateDebtPlan = exports.testMistral = exports.askAiAdvisor = void 0;
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
var getAssetQuote_1 = require("./getAssetQuote");
Object.defineProperty(exports, "getAssetQuote", { enumerable: true, get: function () { return getAssetQuote_1.getAssetQuote; } });
var marketData_1 = require("./marketData");
Object.defineProperty(exports, "getMarketData", { enumerable: true, get: function () { return marketData_1.getMarketData; } });
//# sourceMappingURL=index.js.map