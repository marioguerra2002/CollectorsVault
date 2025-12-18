import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/app/types/trades';
export function useTradeMessages() {
  const [messages, setMessages] = useState<Record<string, ChatMessage | null>>({});
  // Escuchar cambios en localStorage (solo en el cliente)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('trade_last_message_')) {
        const userId = e.key.replace('trade_last_message_', '');
        if (e.newValue) {
          setMessages(prev => ({
            ...prev,
            [userId]: JSON.parse(e.newValue)
          }));
        } else {
          setMessages(prev => ({
            ...prev,
            [userId]: null
          }));
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const saveMessage = useCallback((userId: string, message: ChatMessage) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`trade_last_message_${userId}`, JSON.stringify(message));
    setMessages(prev => ({
      ...prev,
      [userId]: message
    }));
  }, []);
  const getLastMessage = useCallback((userId: string): ChatMessage | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(`trade_last_message_${userId}`);
    return stored ? JSON.parse(stored) : null;
  }, []);
  const deleteConversation = useCallback(async (otherUserId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/conversations/${otherUserId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Limpiar del localStorage también
        localStorage.removeItem(`trade_last_message_${otherUserId}`);
        localStorage.removeItem(`trade_messages_${otherUserId}`);
        localStorage.removeItem(`trade_last_proposal_${otherUserId}`);
        // Actualizar estado local
        setMessages(prev => {
          const updated = { ...prev };
          delete updated[otherUserId];
          return updated;
        });
        return true;
      } else {
        console.error(`❌ Error al eliminar conversación:`, response.status, response.statusText);
      }
      return false;
    } catch (error) {
      console.error('❌ Error eliminando conversación:', error);
      return false;
    }
  }, []);
  return {
    messages,
    saveMessage,
    getLastMessage,
    setMessages,
    deleteConversation
  };
}
