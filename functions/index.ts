
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// Variáveis de ambiente (Configure no Firebase: functions.config().stripe.secret e .webhook)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_PLACEHOLDER";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Mapeamento de Planos do Frontend para PriceIDs do Stripe
const STRIPE_PLANS_MAP: Record<string, string> = {
  "pro_monthly": "price_pro_trial_PLACEHOLDER",
  "premium_monthly": "price_premium_trial_PLACEHOLDER",
};

/**
 * 1. createCheckoutSession
 * Cria sessão de checkout para assinatura com trial
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
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7, // 7 dias grátis
        metadata: { firebaseUid: uid, planId: planId }
      },
      success_url: "https://financasproinvest.com.br/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://financasproinvest.com.br/upgrade",
      metadata: { firebaseUid: uid, planId: planId },
    });

    return { url: session.url, sessionId: session.id };
  } catch (error: any) {
    console.error("Erro checkout:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 2. stripeWebhook
 * Gerencia eventos de assinatura e pagamento
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

  const session = event.data.object as any;

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(session);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(session);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook Handler Error:", err);
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
        status: "trialing", // Começa como trial
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  // Busca usuário pelo Stripe ID (é necessário indexar stripeCustomerId no Firestore)
  const usersSnap = await db.collection("users").where("subscription.stripeCustomerId", "==", customerId).limit(1).get();
  
  if (!usersSnap.empty) {
    const userDoc = usersSnap.docs[0];
    const status = subscription.status;
    const planId = subscription.items.data[0].price.id; // Mapear de volta se necessário
    
    // Determina o tier baseado no preço (simplificado)
    // Em produção, consultar STRIPE_PLANS_MAP reverso
    
    let tier = userDoc.data().plan; // Mantém atual se não conseguir determinar
    if (status === 'active' || status === 'trialing') {
       // Atualiza expiry date
       const expiryDate = new Date(subscription.current_period_end * 1000);
       
       await userDoc.ref.set({
         subscription: {
           status: status,
           currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
           currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
           expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
           cancelAtPeriodEnd: subscription.cancel_at_period_end
         }
       }, { merge: true });
    } else {
       // Cancelado ou não pago
       await userDoc.ref.set({
         plan: 'free', // Downgrade
         subscription: { status: status }
       }, { merge: true });
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const usersSnap = await db.collection("users").where("subscription.stripeCustomerId", "==", customerId).limit(1).get();

  if (!usersSnap.empty) {
    const userId = usersSnap.docs[0].id;
    
    await db.collection("payments").add({
      userId: userId,
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

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  // Enviar email ou notificação de falha
  console.log(`Pagamento falhou para invoice ${invoice.id}`);
}

/**
 * 3. updateUserPlan
 * Atualiza manualmente o plano (Admin ou lógica interna)
 */
export const updateUserPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
  
  const { newPlan } = data;
  const uid = context.auth.uid;

  if (!['free', 'pro', 'premium'].includes(newPlan)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid plan");
  }

  await db.collection("users").doc(uid).update({
    plan: newPlan,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});
