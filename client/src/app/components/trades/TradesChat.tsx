'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, IProposalMessagePayload, ITradeSide } from '@/app/types/trades';
import { useTradeMessages } from '@/app/hooks/useTradeMessages';
import { useTranslations } from '@/hooks/useTranslations';
interface TradeChatProps {
  userId: string;
  username: string;
  avatarUrl?: string;
  roomId?: string;
  currentUserId?: string;
  onProposalReceived?: (proposal: IProposalMessagePayload) => void;
  pendingProposal?: IProposalMessagePayload | null;
  onProposalSent?: () => void;
  socket?: Socket | null;
  isLocked?: boolean;
  lockReason?: 'accepted' | 'deleted' | null;
  onLocked?: (reason: 'accepted' | 'deleted') => void;
}
export default function TradesChat({ 
  userId, 
  username,
  avatarUrl,
  roomId,
  currentUserId,
  onProposalReceived,
  pendingProposal,
  onProposalSent,
  socket: externalSocket,
  isLocked: lockedProp = false,
  lockReason,
  onLocked,
}: TradeChatProps) {
  const t = useTranslations();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(externalSocket || null);
  const [isLocked, setIsLocked] = useState<boolean>(lockedProp);
  const [lockedReason, setLockedReason] = useState<'accepted' | 'deleted' | null>(lockReason || null);
  const { saveMessage } = useTradeMessages();
  
  useEffect(() => {
    setIsLocked(!!lockedProp);
  }, [lockedProp]);
  
  useEffect(() => {
    setLockedReason(lockReason || null);
  }, [lockReason]);
  
  // Cargar mensajes previos desde la BD al montar
  useEffect(() => {
    if (!currentUserId || !userId || !roomId) return;
    const loadConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${userId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const conversation = await response.json();
          if (conversation.isLocked) {
            setIsLocked(true);
            setLockedReason(conversation.lockedReason || null);
            if (conversation.lockedReason && onLocked) {
              onLocked(conversation.lockedReason);
            }
          }
          if (conversation.messages && conversation.messages.length > 0) {
            const loadedMessages = conversation.messages.map((msg: any) => ({
              ...msg,
              id: msg._id || `${msg.createdAt}-${msg.fromUserId}`,
              isMe: msg.fromUserId === currentUserId,
              kind: msg.kind,
              payload: msg.payload,
              createdAt: new Date(msg.createdAt).getTime(),
              fromUserId: msg.fromUserId
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (e) {
        console.error('Error cargando conversación de BD:', e);
      }
    };
    loadConversation();
  }, [userId, currentUserId, roomId, onLocked]);
  
  // Inicializar Socket.IO o usar el externo
  useEffect(() => {
    let socketInstance: Socket | null = null;
    
    if (externalSocket && externalSocket.connected) {
      // Usar el socket externo si está disponible y conectado
      socketInstance = externalSocket;
      setSocket(socketInstance);
      // Unirse a la sala de este chat
      if (roomId) {
        socketInstance.emit('trade:join', { roomId });
      }
    } else if (!externalSocket) {
      // Crear un nuevo socket si no hay socket externo (fallback)
      socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'https://collectorsvault.onrender.com', {
        withCredentials: true,
      });
      socketInstance.on('connect', () => {
        if (roomId) {
          socketInstance?.emit('trade:join', { roomId });
        }
      });
      setSocket(socketInstance);
    }
    
    if (!socketInstance) return;
    
    // Listener para mensajes en la sala
    const handleTradeSync = (msg: any) => {
      const chatMessage = {
        ...msg,
        id: msg.id || `${Date.now()}-${Math.random()}`,
        isMe: msg.fromUserId === currentUserId
      };
      
      if (msg.kind === 'system') {
        const reason = (msg.payload as any)?.reason;
        setIsLocked(true);
        setLockedReason(reason || null);
        if (reason && onLocked) {
          onLocked(reason);
        }
      }
      
      // Evitar duplicados verificando si ya existe
      setMessages(prev => {
        const exists = prev.find(m => m.createdAt === msg.createdAt && m.fromUserId === msg.fromUserId);
        if (exists) {
          return prev;
        }
        return [...prev, chatMessage];
      });
      
      // Guardar el último mensaje usando el hook (para sidebar)
      saveMessage(userId, chatMessage);
      
      if (msg.kind === 'proposal' && msg.fromUserId !== currentUserId) {
        if (msg.payload && onProposalReceived) {
          onProposalReceived(msg.payload);
        }
      }
    };
    
    socketInstance.on('trade:sync', handleTradeSync);
    
    return () => {
      socketInstance?.off('trade:sync', handleTradeSync);
      // Solo desconectar si es un socket local (no el externo)
      if (!externalSocket && socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [roomId, currentUserId, onProposalReceived, userId, saveMessage, externalSocket, onLocked]);
  const handleSendTextMessage = useCallback(async () => {
    if (isLocked) return;
    if (!message.trim() || !socket || !roomId) return;
    const timestamp = Date.now();
    const chatMessage = {
      roomId,
      kind: 'text' as const,
      payload: { text: message },
      createdAt: timestamp,
      fromUserId: currentUserId || '',
      toUserId: userId,
    };
    socket.emit('trade:message', chatMessage);
    const newMessage = {
      ...chatMessage,
      id: `${timestamp}-${Math.random()}`,
      isMe: true,
    };
    setMessages(prev => [...prev, newMessage]);
    // Guardar usando el hook
    saveMessage(userId, newMessage);
    setMessage('');
  }, [message, socket, roomId, currentUserId, userId, saveMessage, isLocked]);
  const handleSendProposal = useCallback((proposal: IProposalMessagePayload) => {
    if (isLocked) return;
    if (!socket || !roomId) {
      return;
    }
    const timestamp = Date.now();
    const chatMessage = {
      roomId,
      kind: 'proposal' as const,
      payload: proposal,
      createdAt: timestamp,
      fromUserId: currentUserId || '',
      toUserId: userId,
    };
    socket.emit('trade:message', chatMessage);
    const newMessage = {
      ...chatMessage,
      id: `${timestamp}-${Math.random()}`,
      isMe: true,
    };
    setMessages(prev => {
      const newMessages = [...prev, newMessage];
      // Guardar en localStorage para persistencia
      if (typeof window !== 'undefined' && roomId) {
        localStorage.setItem(`trade_messages_${roomId}`, JSON.stringify(newMessages));
      }
      return newMessages;
    });
    // Guardar usando el hook
    saveMessage(userId, newMessage);
  }, [socket, roomId, currentUserId, userId, saveMessage, isLocked]);
  // Enviar propuesta pendiente cuando esté disponible
  useEffect(() => {
    if (isLocked) return;
    if (pendingProposal && socket && roomId && socket.connected) {
      handleSendProposal(pendingProposal);
      // Limpiar inmediatamente para evitar re-envíos
      onProposalSent?.();
    } else {
      console.log('No se puede enviar propuesta pendiente:', {
        pendingProposal: !!pendingProposal,
        socket: !!socket,
        roomId: !!roomId,
        connected: socket?.connected
      });
    }
  }, [pendingProposal, socket, roomId, isLocked]);
  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* 1. Cabecera del Chat */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-gray-800/50">
        <div className="relative w-8 h-8">
          <Image 
            src={avatarUrl || `https://i.pravatar.cc/150?u=${userId}`} 
            alt={username}
            fill
            className="rounded-full object-cover"
            unoptimized
          />
        </div>
        <span className="font-bold text-gray-200">{username}</span>
      </div>
      {/* 2. Área de Mensajes */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto flex flex-col">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.kind === 'text' ? (
              <div 
                className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  msg.isMe 
                    ? 'bg-blue-600 text-white self-end rounded-br-none ml-auto' 
                    : 'bg-gray-800 text-gray-300 self-start rounded-bl-none border border-gray-700'
                }`}
              >
                <p>{(msg.payload as any).text}</p>
              </div>
            ) : msg.kind === 'system' ? (
              <div className="max-w-[85%] px-3 py-2 rounded-lg text-xs text-yellow-200 bg-gray-800 border border-yellow-600/60 self-center text-center mx-auto">
                <p className="font-semibold">{(msg.payload as any)?.text}</p>
                {((msg.payload as any)?.reason || lockedReason) && (
                  <p className="text-[11px] text-yellow-300/80 mt-1">
                    {((msg.payload as any)?.reason || lockedReason) === 'accepted' 
                      ? 'Intercambio aceptado, chat bloqueado'
                      : 'Propuesta eliminada, chat bloqueado'}
                  </p>
                )}
              </div>
            ) : (
              <div 
                className={`max-w-[85%] p-3 rounded-xl text-sm border ${
                  msg.isMe 
                    ? 'bg-green-900/20 border-green-500 self-end rounded-br-none ml-auto' 
                    : 'bg-yellow-900/20 border-yellow-500 self-start rounded-bl-none'
                }`}
              >
                <p className="text-xs font-bold mb-2">
                  {msg.isMe ? t('trades.yourProposal') : t('trades.newProposal')}
                </p>
                <p className="text-xs text-gray-300">
                  {t('trades.tradeProposal')} ({(msg.payload as IProposalMessagePayload).tempTradeId})
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* 3. Área de Acciones (Botones de Negociación) */}
      <div className="p-4 bg-gray-800/30 border-t border-gray-700 space-y-3">
        {isLocked && (
          <div className="text-xs text-yellow-200 bg-gray-800 border border-yellow-600/60 rounded-lg px-3 py-2">
            {lockedReason === 'accepted'
              ? 'Propuesta aceptada, puede eliminar el chat'
              : 'Propuesta eliminada, puede eliminar el chat'}
          </div>
        )}
        { /* 
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition shadow-lg shadow-green-900/20 text-sm transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400">
            {t('trades.accept')}
          </button>
          <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition shadow-lg shadow-red-900/20 text-sm transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400">
            {t('trades.reject')}
          </button>
        </div>
        */}
        {/* Input de Mensaje */}
        <div className="flex gap-2 mt-2 pt-3 border-gray-700/50">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendTextMessage()}
            placeholder={t('trades.writeMessage')}
            className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700 disabled:opacity-50"
            disabled={isLocked}
          />
          <button 
            onClick={handleSendTextMessage}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLocked}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}