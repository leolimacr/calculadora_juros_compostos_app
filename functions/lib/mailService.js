"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATES = exports.sendEmail = void 0;
const sendEmail = async (to, templateId, data) => {
    console.log(`[MAIL SERVICE] Enviando e-mail para: ${to}`);
    console.log(`[MAIL SERVICE] Template: ${templateId}`);
    console.log(`[MAIL SERVICE] Dados:`, data);
    return true;
};
exports.sendEmail = sendEmail;
exports.TEMPLATES = {
    WELCOME_FREE: 'd-welcome-free-id',
    WELCOME_PRO: 'd-welcome-pro-id',
    TRIAL_ENDING: 'd-trial-ending-id',
    PAYMENT_SUCCESS: 'd-payment-success-id',
    WEEKLY_NEWSLETTER: 'd-newsletter-id',
    RE_ENGAGEMENT: 'd-reengagement-id'
};
//# sourceMappingURL=mailService.js.map