'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from '@/hooks/useTranslations';
interface NotificationUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastMessage?: string;
  unreadCount: number;
  timestamp?: Date;
}
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  socket?: any;
}
export default function NotificationModal({ 
  isOpen, 
  onClose, 
  currentUserId,
  socket 
}: NotificationModalProps) {
  const t = useTranslations();
  const [notificationUsers, setNotificationUsers] = useState<NotificationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Cargar usuarios con nuevos mensajes
  const loadNotifications = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      });
      if (response.ok) {
        const conversations = await response.json();
        // Convertir conversaciones en notificaciones
        const notifs: NotificationUser[] = conversations.map((conv: any) => ({
          id: conv.otherUserId._id || conv.otherUserId,
          username: conv.otherUser?.username || conv.otherUserId,
          avatarUrl: conv.otherUser?.profileImageUrl,
          lastMessage: conv.lastMessage 
            ? (conv.lastMessage.kind === 'text' 
                ? conv.lastMessage.payload.text 
                : t('notifications.tradeProposal'))
            : 'Sin mensajes',
          unreadCount: 1, // Podrías mejorar esto con un contador real en BD
          timestamp: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined
        }));
        setNotificationUsers(notifs);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);
  // Escuchar nuevos mensajes en tiempo real
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: any) => {
      const otherUserId = msg.fromUserId === currentUserId ? msg.toUserId : msg.fromUserId;
      setNotificationUsers(prev => {
        const exists = prev.find(u => u.id === otherUserId);
        if (exists) {
          // Actualizar usuario existente
          return prev.map(u => 
            u.id === otherUserId 
              ? {
                  ...u,
                  lastMessage: msg.kind === 'text' ? msg.payload.text : t('notifications.tradeProposal'),
                  timestamp: new Date(),
                  unreadCount: u.unreadCount + 1
                }
              : u
          ).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
        }
        return prev;
      });
    };
    socket.on('trade:sync', handleNewMessage);
    return () => {
      socket.off('trade:sync', handleNewMessage);
    };
  }, [socket, currentUserId, t]);
  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  const handleNavigateToTrade = (userId: string) => {
    // Guardar el usuario objetivo en sessionStorage
    sessionStorage.setItem('trade_target_user_id', userId);
    // Navegar a trades
    window.location.href = `/trades?user=${userId}`;
    onClose();
  };
  if (!isOpen) return null;
  return (
      <div
        ref={panelRef}
        className="absolute top-12 right-0 w-96 max-h-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-900">
          <h2 className="text-white font-semibold">{t('notifications.title')}</h2>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              {t('notifications.loading')}
            </div>
          ) : notificationUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {t('notifications.noNotifications')}
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {notificationUsers.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleNavigateToTrade(user.id)}
                    className="w-full px-4 py-3 hover:bg-gray-700 transition-colors text-left flex items-start gap-3"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center relative">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                      {/* Badge de unread */}
                      {user.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {user.unreadCount > 9 ? '9+' : user.unreadCount}
                        </span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.username}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {user.lastMessage}
                      </p>
                      {user.timestamp && (
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(user.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  );
}
