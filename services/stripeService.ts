
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../firebase';
import { SubscriptionPlanId } from '../config/stripePlans';
import { logEvent } from './logger';
import { trackStartCheckout } from './analyticsService';

interface CheckoutResponse {
  url: string;
}

export const startCheckout = async (planId: SubscriptionPlanId) => {
  if (!auth.currentUser) {
    logEvent('warn', 'Checkout tentado sem usuário logado');
    window.location.href = '/?tool=login&redirect=upgrade'; 
    return;
  }

  try {
    logEvent('info', 'Iniciando checkout', { planId, uid: auth.currentUser.uid });
    trackStartCheckout(planId);

    const createCheckoutSession = httpsCallable<{ planId: string }, CheckoutResponse>(
      functions, 
      'createCheckoutSession'
    );

    const { data } = await createCheckoutSession({ planId });
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("URL de checkout não retornada.");
    }
  } catch (error: any) {
    logEvent('error', 'Erro ao iniciar checkout', { error: error.message });
    alert("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
  }
};
