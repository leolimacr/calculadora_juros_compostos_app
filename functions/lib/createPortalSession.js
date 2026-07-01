"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPortalSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const stripe_1 = __importDefault(require("stripe"));
const firestore_1 = require("firebase-admin/firestore");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});
const db = (0, firestore_1.getFirestore)();
exports.createPortalSession = (0, https_1.onCall)(async (request) => {
    const auth = request.auth;
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const uid = auth.uid;
    const billingRef = db.collection('users').doc(uid).collection('billing').doc('main');
    const billingSnap = await billingRef.get();
    let customerId = billingSnap.exists
        ? (billingSnap.data()?.providerCustomerId ?? null)
        : null;
    if (!customerId) {
        const snap = await db.collection('stripeCustomers')
            .where('uid', '==', uid)
            .limit(1)
            .get();
        if (!snap.empty) {
            customerId = snap.docs[0].id;
        }
    }
    if (!customerId) {
        throw new https_1.HttpsError('failed-precondition', 'No subscription found. User has no Stripe customer.');
    }
    const { returnUrl } = request.data;
    const finalReturnUrl = returnUrl ?? 'https://app.financasproinvest.com.br/app/mais/pricing';
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: finalReturnUrl,
        });
        logger.info(`Portal session created for user ${uid}: ${session.id}`);
        return { url: session.url };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create portal session';
        logger.error(`Error creating portal for user ${uid}: ${message}`);
        throw new https_1.HttpsError('internal', message);
    }
});
//# sourceMappingURL=createPortalSession.js.map