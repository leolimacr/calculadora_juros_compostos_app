
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURAÇÃO ---
// Use variáveis de ambiente em produção: functions.config().stripe.secret
const stripe = new Stripe("sk_test_PLACEHOLDER_KEY", {
  apiVersion: "2023-10-16",
});
const STRIPE_WEBHOOK_SECRET = "whsec_PLACEHOLDER_SECRET";

// Deve bater com src/config/stripePlans.ts
const STRIPE_PLANS_MAP: Record<string, string> = {
  "app_monthly": "price_app_monthly_PLACEHOLDER",
  "app_annual": "price_app_annual_PLACEHOLDER",
  "site_monthly": "price_site_monthly_PLACEHOLDER",
  "site_annual": "price_site_annual_PLACEHOLDER",
  "combo_annual": "price_combo_annual_PLACEHOLDER",
};

/**
 * Cria Sessão de Checkout
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const { planId } = data;
  const uid = context.auth.uid;
  const stripePriceId = STRIPE_PLANS_MAP[planId];

  if (!stripePriceId) {
    throw new functions.https.HttpsError("invalid-argument", "Plano inválido.");
  }

  try {
    // 1. Busca/Cria Customer
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    let customerId = userDoc.data()?.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: { firebaseUid: uid },
      });
      customerId = customer.id;
      await userRef.set({ subscription: { stripeCustomerId: customerId } }, { merge: true });
    }

    // 2. Cria Sessão
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      // Ajuste o domínio conforme ambiente (dev/prod)
      success_url: "https://financasproinvest.com.br/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://financasproinvest.com.br/upgrade?cancel=true",
      metadata: { firebaseUid: uid, planId: planId },
    });

    return { url: session.url };
  } catch (error: any) {
    console.error("Erro checkout:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Webhook Stripe
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig as string, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.firebaseUid;
    const planId = session.metadata?.planId;

    if (uid && planId) {
      try {
        const now = admin.firestore.Timestamp.now();
        const isAnnual = planId.includes("annual");
        
        // Calcula validade (simplificado)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + (isAnnual ? 1 : 0));
        expiryDate.setMonth(expiryDate.getMonth() + (isAnnual ? 0 : 1));
        // Dá 1 dia de graça pra evitar expiração prematura por fuso
        expiryDate.setDate(expiryDate.getDate() + 1);

        const isApp = planId.includes("app") || planId === "combo_annual";
        const isSite = planId.includes("site") || planId === "combo_annual";

        await db.collection("users").doc(uid).set({
          subscription: {
            plan: planId,
            status: "active",
            startDate: now,
            expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          },
          access: {
            app_premium: isApp,
            site_premium: isSite,
            // Mantém emailVerified se já existir
          }
        }, { merge: true });

        console.log(`✅ [Webhook] Assinatura ativada user=${uid} plan=${planId}`);
      } catch (e) {
        console.error("❌ [Webhook] Erro ao atualizar Firestore", e);
        res.status(500).send("Database update failed");
        return;
      }
    }
  }

  res.json({ received: true });
});
