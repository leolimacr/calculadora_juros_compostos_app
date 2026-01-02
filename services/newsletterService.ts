
import firebase from 'firebase/compat/app';
import { database, authReadyPromise } from '../firebase';

/**
 * Salva um e-mail na lista de newsletter do Firebase.
 * @param email O e-mail do usuário.
 * @param source A origem da inscrição (ex: 'hub_conhecimento', 'footer').
 */
export const subscribeToNewsletter = async (email: string, source: string = 'general') => {
  try {
    // Garante que o Auth do Firebase está inicializado (login anônimo ou real)
    await authReadyPromise;

    const subscribersRef = database.ref('newsletter/subscribers');
    
    await subscribersRef.push({
      email,
      source,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      userAgent: window.navigator.userAgent 
    });

    return true;
  } catch (error) {
    console.error("Erro ao inscrever na newsletter:", error);
    throw error; // Repassa o erro para a UI tratar
  }
};
