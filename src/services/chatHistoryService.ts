import { database } from '../firebase';
import { ref, set, push, get, query, orderByChild, update } from 'firebase/database';

export interface ChatHistoryMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface ChatHistoryItem {
  id?: string;
  userId: string;
  title: string;
  messages: ChatHistoryMessage[];
  toolContext?: string;
  createdAt: number;
  lastUpdated: number;
}

export const saveChatHistory = async (userId: string, historyItem: Omit<ChatHistoryItem, 'id'>): Promise<string> => {
  try {
    const userChatsRef = ref(database, `chatHistory/${userId}`);
    const newChatRef = push(userChatsRef);
    const newChatId = newChatRef.key;

    if (!newChatId) throw new Error('Não foi possível gerar ID para a conversa.');

    await set(newChatRef, {
      ...historyItem,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });

    return newChatId;
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
    throw error;
  }
};

export const loadUserChatHistory = async (userId: string): Promise<ChatHistoryItem[]> => {
  try {
    const userChatsRef = ref(database, `chatHistory/${userId}`);
    // Ordena por lastUpdated DESCENDENTE (mais recentes primeiro)
    const orderedQuery = query(userChatsRef, orderByChild('lastUpdated'));
    const snapshot = await get(orderedQuery);

    const history: ChatHistoryItem[] = [];
    snapshot.forEach((childSnapshot) => {
      history.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    // Já vem ordenado ascendente do Firebase, revertemos para descendente
    return history.reverse();
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    throw error;
  }
};

export const updateChatHistory = async (userId: string, chatId: string, updates: Partial<ChatHistoryItem>): Promise<void> => {
  try {
    const chatRef = ref(database, `chatHistory/${userId}/${chatId}`);
    await update(chatRef, {
      ...updates,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Erro ao atualizar histórico:', error);
    throw error;
  }
};

export const deleteChatHistory = async (userId: string, chatId: string): Promise<void> => {
  try {
    const chatRef = ref(database, `chatHistory/${userId}/${chatId}`);
    await set(chatRef, null);
  } catch (error) {
    console.error('Erro ao excluir histórico:', error);
    throw error;
  }
};