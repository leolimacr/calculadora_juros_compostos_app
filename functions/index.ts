
/* 
  INSTRUÇÕES PARA BACKEND (Firebase Functions)
  
  Copie este código para o arquivo index.ts da sua pasta 'functions'.
  Instale as dependências na pasta functions:
  npm install firebase-admin firebase-functions stripe
*/

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// Configure sua chave secreta do Stripe aqui ou use variaveis de ambiente
const stripe = new Stripe("sk_test_PLACEHOLDER_KEY", {
  apiVersion: "2023-10-16", // Use a versão mais recente
});

// Endpoint Secret do Webhook (Obtido no Dashboard do Stripe)
const STRIPE_WEBHOOK_SECRET = "whsec_PLACEHOLDER_SECRET";

// Mapeamento de Planos (Deve estar sincronizado com o frontend)
const STRIPE_PLANS = {
  app_monthly: { priceId: "price_app_monthly_PLACEHOLDER", access: { app: true, site: false } },
  app_annual: { priceId: "price_app_annual_PLACEHOLDER", access: { app: true, site: false } },
  site_monthly: { priceId: "price_site_monthly_PLACEHOLDER", access: { app: false, site: true } },
  site_annual: { priceId: "price_site_annual_PLACEHOLDER", access: { app: false, site: true } },
  combo_annual: { priceId: "price_combo_annual_PLACEHOLDER", access: { app: true, site: true } },
};

/**
 * Cria uma Sessão de Checkout do Stripe
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário deve estar logado.");
  }

  const { planId } = data;
  const uid = context.auth.uid;
  const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];

  if (!plan) {
    throw new functions.https.HttpsError("invalid-argument", "Plano inválido.");
  }

  // Busca ou cria cliente Stripe
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

  // Cria Sessão
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: "https://financasproinvest.com.br/panel?success=true", // Ajuste seu domínio
    cancel_url: "https://financasproinvest.com.br/upgrade?cancel=true",
    metadata: { firebaseUid: uid, planId: planId },
  });

  return { url: session.url };
});

/**
 * Webhook para atualizar Firestore após pagamento
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig as string, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.firebaseUid;
    const planId = session.metadata?.planId;

    if (uid && planId) {
      const planConfig = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];
      
      // Calcular validade
      const now = admin.firestore.Timestamp.now();
      const isAnnual = planId.includes("annual");
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + (isAnnual ? 1 : 0));
      expiryDate.setMonth(expiryDate.getMonth() + (isAnnual ? 0 : 1));

      // Atualizar Firestore
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
          app_premium: planConfig.access.app,
          site_premium: planConfig.access.site,
        }
      }, { merge: true });
      
      console.log(`✅ Assinatura ativada para ${uid}: ${planId}`);
    }
  }

  res.json({ received: true });
});
