'use client';
import Image from 'next/image';
import NotFoundError from '../ui/notfoundError';
import Loader from '../ui/loader';
import { useTradeMessages } from '@/app/hooks/useTradeMessages';
import type { ChatMessage } from '@/app/types/trades';
import { useTranslations } from '@/hooks/useTranslations';
import { useState } from 'react';
interface TradesSidebarProps {
  users: { id: string; username: string; avatarUrl?: string; lastMessage?: string }[]; // Lista de usuarios
  loading: boolean;
  error: string | null;
  selectedUserId: string | null;
  onUserSelect: (userId: string) => void; // Callback al seleccionar un usuario (esto puede abrir el chat o trade)
  onUserDeleted?: (userId: string) => void; // Callback cuando se elimina una conversación
}
export interface ChatUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastMessage?: string;
}
export default function TradesSidebar({ users, loading, error, selectedUserId, onUserSelect, onUserDeleted }: TradesSidebarProps) {
  const t = useTranslations();
  const { messages, deleteConversation } = useTradeMessages();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const getLastMessageText = (userId: string) => {
    const message = messages[userId];
    if (!message) return t('trades.clickToSeeProposal');
    if (message.kind === 'text') {
      return (message.payload as any).text;
    } else {
      return '📦 ' + t('trades.proposalReceived');
    }
  };
  const handleDeleteConversation = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.')) {
      setDeletingUserId(userId);
      const success = await deleteConversation(userId);
      if (success) {
        onUserDeleted?.(userId);
      } else {
        console.error(`❌ No se pudo eliminar la conversación`);
        alert('Error al eliminar la conversación. Intenta de nuevo.');
      }
      setDeletingUserId(null);
    }
  };
  if (loading) {
    return <div className="p-4"><Loader /></div>;
  }
  if (error) {
    return <div className="p-4"><NotFoundError /></div>;
  }
  return (
    <div className="h-full flex flex-col bg-gray-900/50 border-r border-gray-800">
      {/* Cabecera del Sidebar */}
      <div className="p-4 border-b border-gray-800 h-16 flex items-center">
        <h2 className="text-xl font-bold text-gray-200">{t('trades.proposalList')}</h2>
      </div>
      {/* Lista de usuarios */}
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>{t('trades.noActiveConversations')}</p>
          </div>
        ) : (
          users.map((user) => {
            const isSelected = selectedUserId === user.id;
            const lastMessage = getLastMessageText(user.id);
            const isDeleting = deletingUserId === user.id;
            return (
              <div
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                // CLASES DINÁMICAS:
                // - border-l-4: Borde izquierdo de 4px
                // - border-blue-500: Si está seleccionado, azul. Si no, transparente (para que no salte el texto).
                className={`
                  flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-gray-800/50
                  border-l-4 relative group
                  ${isSelected 
                    ? 'bg-gray-800 border-l-blue-500 shadow-inner' 
                    : 'hover:bg-gray-800/40 border-l-transparent'
                  }
                  ${isDeleting ? 'opacity-50' : ''}
                `}
              >
                {/* Avatar */}
                <div className="relative">
                  <Image
                    src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-gray-600"
                    unoptimized // Útil si usas pravatar o URLs externas dinámicas
                  />
                </div>
                {/* Info de Texto */}
                <div className="flex-1 min-w-0"> {/* min-w-0 es vital para que funcione truncate */}
                  <div className="flex justify-between items-baseline">
                    <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {user.username}
                    </h3>
                    {/* Fecha simulada (opcional) */}
                    <span className="text-xs text-gray-600">12:30</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {lastMessage}
                  </p>
                </div>
                {/* Botón de eliminar (visible al hacer hover) */}
                <button
                  onClick={(e) => handleDeleteConversation(e, user.id)}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-900/30 text-red-400 hover:text-red-300"
                  title="Eliminar conversación"
                >
                  {isDeleting ? (
                    <span className="text-sm">⏳</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 2.991a.75.75 0 00-.992-.022l-.022.992m0 0L7.84 2.991m10.319 17.298a.75.75 0 00-.668-1.33 60.519 60.519 0 01-5.202 0 .75.75 0 00-.668 1.33m5.538-9.538a.75.75 0 00-1.296-.049 60.522 60.522 0 011.295.049" />
                    </svg>
                  )}
                </button>
                {/* Flecha decorativa (solo visible al hacer hover o estar activo) */}
                <span className={`text-gray-600 text-lg transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                  ›
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
