
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { sendEmail, TEMPLATES } from "./mailService";

admin.initializeApp();
const db = admin.firestore();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_PLACEHOLDER";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const STRIPE_PLANS_MAP: Record<string, string> = {
  "pro_monthly": "price_pro_trial_PLACEHOLDER",
  "premium_monthly": "price_premium_trial_PLACEHOLDER",
};

// --- E-MAIL AUTOMATION TRIGGERS ---

/**
 * 1. Enviar e-mail de Boas-vindas ao criar usuário (FREE)
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  const name = user.displayName || "Investidor";
  
  if (email) {
    await sendEmail(email, TEMPLATES.WELCOME_FREE, { name });
  }
});

/**
 * 2. Enviar e-mail ao mudar de plano (Upgrade/Downgrade)
 */
export const onUserPlanUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Detecta Upgrade para PRO/PREMIUM
    if (oldData.plan === 'free' && newData.plan !== 'free') {
      const email = newData.email;
      const name = newData.displayName || "Investidor";
      await sendEmail(email, TEMPLATES.WELCOME_PRO, { name, plan: newData.plan });
    }
  });

/**
 * 3. Cron Job: Verificar Trials Expirando (Diário)
 */
export const checkTrialExpirations = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  // 2 dias a partir de agora
  const twoDaysFromNow = admin.firestore.Timestamp.fromMillis(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000);

  // Busca usuários cujo trial vence entre 48h e 72h a partir de agora
  const expiringTrials = await db.collection('users')
    .where('subscription.status', '==', 'trialing')
    .where('subscription.trialEndDate', '>=', twoDaysFromNow)
    .where('subscription.trialEndDate', '<', threeDaysFromNow)
    .get();

  expiringTrials.forEach(async (doc) => {
    const data = doc.data();
    if (data.email) {
      await sendEmail(data.email, TEMPLATES.TRIAL_ENDING, { 
        name: data.displayName || "Investidor",
        trialEndDate: data.subscription.trialEndDate.toDate().toLocaleDateString()
      });
    }
  });
});

/**
 * 4. Cron Job: Newsletter Semanal (Segunda 9am) - Apenas Premium
 */
export const sendWeeklyNewsletter = functions.pubsub.schedule('every monday 09:00').timeZone('America/Sao_Paulo').onRun(async (context) => {
  const premiumUsers = await db.collection('users')
    .where('plan', '==', 'premium')
    .get();

  premiumUsers.forEach(async (doc) => {
    const data = doc.data();
    if (data.email) {
      await sendEmail(data.email, TEMPLATES.WEEKLY_NEWSLETTER, { 
        name: data.displayName || "Investidor",
        content: "Resumo semanal do mercado e dicas exclusivas." 
      });
    }
  });
});

// --- STRIPE FUNCTIONS EXISTENTES ---

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
  const { planId } = data;
  const uid = context.auth.uid;
  const stripePriceId = STRIPE_PLANS_MAP[planId];
  if (!stripePriceId) throw new functions.https.HttpsError("invalid-argument", "Plano inválido.");

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    let customerId = userDoc.data()?.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: context.auth.token.email, metadata: { firebaseUid: uid } });
      customerId = customer.id;
      await userRef.set({ subscription: { stripeCustomerId: customerId } }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7, metadata: { firebaseUid: uid, planId: planId } },
      success_url: "https://financasproinvest.com.br/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://financasproinvest.com.br/upgrade",
      metadata: { firebaseUid: uid, planId: planId },
    });

    return { url: session.url, sessionId: session.id };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig as string, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  const session = event.data.object as any;

  try {
    switch (event.type) {
      case "checkout.session.completed": await handleCheckoutCompleted(session); break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted": await handleSubscriptionUpdated(session); break;
      case "invoice.payment_succeeded": await handleInvoicePaid(session); break;
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).send("Internal Error");
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const uid = session.metadata?.firebaseUid;
  const planId = session.metadata?.planId;
  if (uid && planId) {
    const tier = planId.includes('premium') ? 'premium' : 'pro';
    await db.collection("users").doc(uid).set({
      plan: tier,
      subscription: {
        status: "trialing",
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        trialEndDate: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) // Helper provisional
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const usersSnap = await db.collection("users").where("subscription.stripeCustomerId", "==", customerId).limit(1).get();
  if (!usersSnap.empty) {
    const userDoc = usersSnap.docs[0];
    const status = subscription.status;
    if (status === 'active' || status === 'trialing') {
       const expiryDate = new Date(subscription.current_period_end * 1000);
       await userDoc.ref.set({
         subscription: {
           status: status,
           currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
           currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
           expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
           trialEndDate: subscription.trial_end ? admin.firestore.Timestamp.fromMillis(subscription.trial_end * 1000) : null,
           cancelAtPeriodEnd: subscription.cancel_at_period_end
         }
       }, { merge: true });
    } else {
       await userDoc.ref.set({ plan: 'free', subscription: { status: status } }, { merge: true });
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const usersSnap = await db.collection("users").where("subscription.stripeCustomerId", "==", customerId).limit(1).get();
  if (!usersSnap.empty) {
    const userDoc = usersSnap.docs[0];
    // Envia e-mail de confirmação de pagamento
    if (userDoc.data().email) {
       await sendEmail(userDoc.data().email, TEMPLATES.PAYMENT_SUCCESS, { amount: invoice.amount_paid / 100 });
    }
    await db.collection("payments").add({
      userId: userDoc.id,
      stripePaymentId: invoice.payment_intent,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf
    });
  }
}

export const updateUserPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
  const { newPlan } = data;
  const uid = context.auth.uid;
  if (!['free', 'pro', 'premium'].includes(newPlan)) throw new functions.https.HttpsError("invalid-argument", "Invalid plan");
  await db.collection("users").doc(uid).update({ plan: newPlan, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { success: true };
});
