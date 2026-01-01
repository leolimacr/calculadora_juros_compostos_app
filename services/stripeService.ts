
import { functions, auth } from '../firebase';
import { SubscriptionPlanId } from '../config/stripePlans';

interface CheckoutResponse {
  url: string;
}

/**
 * Inicia o fluxo de checkout chamando a Cloud Function.
 * Redireciona o usuário para o Stripe Checkout.
 */
export const startCheckout = async (planId: SubscriptionPlanId) => {
  if (!auth.currentUser) {
    window.location.href = '/?tool=login'; // Redireciona para login se não autenticado
    return;
  }

  try {
    const createCheckoutSession = functions.httpsCallable('createCheckoutSession');

    const { data } = await createCheckoutSession({ planId }) as { data: CheckoutResponse };
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("URL de checkout não retornada.");
    }
  } catch (error) {
    console.error("Erro ao iniciar checkout:", error);
    alert("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
  }
};
