import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
interface NotificationUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastMessage?: string;
  unreadCount: number;
  timestamp?: Date;
}
export function useNotifications(currentUserId: string | null, socket: Socket | null) {
  const [hasNotifications, setHasNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationUsers, setNotificationUsers] = useState<NotificationUser[]>([]);
  // Escuchar nuevos mensajes
  useEffect(() => {
    if (!socket || !currentUserId) return;
    const handleNewMessage = (msg: any) => {
      // Mostrar badge de notificación
      setHasNotifications(true);
      setNotificationCount(prev => prev + 1);
      // Actualizar lista de usuarios con notificaciones
      const otherUserId = msg.fromUserId === currentUserId ? msg.toUserId : msg.fromUserId;
      setNotificationUsers(prev => {
        const exists = prev.find(u => u.id === otherUserId);
        if (exists) {
          return prev.map(u =>
            u.id === otherUserId
              ? {
                  ...u,
                  lastMessage: msg.kind === 'text' ? msg.payload.text : '📦 Propuesta de intercambio',
                  timestamp: new Date(),
                  unreadCount: u.unreadCount + 1
                }
              : u
          );
        }
        return prev;
      });
    };
    socket.on('trade:sync', handleNewMessage);
    return () => {
      socket.off('trade:sync', handleNewMessage);
    };
  }, [socket, currentUserId]);
  // Marcar como leído
  const clearNotifications = useCallback(() => {
    setHasNotifications(false);
    setNotificationCount(0);
    setNotificationUsers([]);
  }, []);
  return {
    hasNotifications,
    notificationCount,
    notificationUsers,
    clearNotifications,
    setNotificationUsers
  };
}
