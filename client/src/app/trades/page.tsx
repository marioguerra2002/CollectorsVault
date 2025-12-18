'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import AppHeader from '@/app/components/collection/AppHeader';
import TradesSidebar from '../components/trades/TradesSidebar';
import TradesDetail from '../components/trades/TradesDetail';
import TradesChat from '../components/trades/TradesChat';
import type { IProposalMessagePayload } from '@/app/types/trades';
import { io, Socket } from 'socket.io-client';
interface ChatUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastMessage?: string;
}
export default function ExchangesPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [receivedProposal, setReceivedProposal] = useState<IProposalMessagePayload | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pendingProposal, setPendingProposal] = useState<IProposalMessagePayload | null>(null);
  const [storedProposal, setStoredProposal] = useState<IProposalMessagePayload | null>(null);
  const [hasPendingProposal, setHasPendingProposal] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [lockReason, setLockReason] = useState<'accepted' | 'deleted' | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const roomId = selectedUserId && currentUserId 
    ? [selectedUserId, currentUserId].sort().join('_')
    : null;
  const fetchUserDetails = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          username: userData.username || u.username,
          avatarUrl: userData.profileImageUrl || u.avatarUrl,
        } : u));
      }
    } catch (e) {
      console.error('Error fetching user details', e);
    }
  }, []);
  // Obtener usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {

        const response = await fetch(`/api/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData._id);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);
  // Cargar usuarios con los que hay conversaciones activas desde la BD
  useEffect(() => {
    if (!currentUserId) return;
    const fetchConversations = async () => {
      try {

        const response = await fetch(`/api/conversations`, {
          credentials: 'include'
        });
        if (response.ok) {
          const conversations = await response.json();
          const activeUsers: ChatUser[] = conversations.map((conv: any) => ({
            id: conv.otherUserId._id || conv.otherUserId,
            username: conv.otherUser?.username || conv.otherUserId,
            avatarUrl: conv.otherUser?.profileImageUrl,
            lastMessage: conv.lastMessage 
              ? (conv.lastMessage.kind === 'text' 
                  ? conv.lastMessage.payload.text 
                  : '📦 Propuesta de intercambio')
              : 'Sin mensajes'
          }));
          setUsers(activeUsers);
          // Si viene un usuario desde sessionStorage, priorizarlo
          const storedTargetUser = sessionStorage.getItem('trade_target_user');
          if (storedTargetUser) {
            try {
              const targetUser = JSON.parse(storedTargetUser);
              // Agregar o actualizar el usuario en la lista
              setUsers(prev => {
                const exists = prev.find(u => u.id === targetUser.id);
                if (exists) {
                  return prev;
                }
                return [{
                  id: targetUser.id,
                  username: targetUser.username,
                  avatarUrl: targetUser.avatarUrl
                }, ...prev];
              });
              setSelectedUserId(targetUser.id);
              sessionStorage.removeItem('trade_target_user');
            } catch (e) {
              console.error('Error parsing target user:', e);
            }
          } else if (activeUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(activeUsers[0].id);
          }
        }
      } catch (error) {
        console.error('Error cargando conversaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [currentUserId]);
  
  // Inicializar Socket.IO global
  useEffect(() => {
    if (!currentUserId) return;
    
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    
    const handleConnect = () => {
      socketInstance.emit('user:subscribe', { userId: currentUserId });
    };
    
    const handleConversationDeleted = (data: any) => {
      if (selectedUserId === data.otherUserId || selectedUserId === data.deletedBy) {
        setSelectedUserId(null);
      }
      setUsers(prev => prev.filter(u => u.id !== data.deletedBy && u.id !== data.otherUserId));
      alert(t('trades.conversationDeleted'));
    };
    
    const handleTradeSync = async (msg: any) => {
      const otherUserId = msg.fromUserId === currentUserId ? msg.toUserId : msg.fromUserId;
      const lastMessage = msg.kind === 'text' ? msg.payload.text : '📦 Propuesta de intercambio';
      
      if (msg.kind === 'system' && msg.payload?.reason && selectedUserIdRef.current === otherUserId) {
        setIsChatLocked(true);
        setLockReason(msg.payload.reason);
      }
      
      if (msg.kind === 'proposal') {
        setSelectedUserId(otherUserId);
      }
      
      setUsers(prev => {
        const exists = prev.find(u => u.id === otherUserId);
        if (!exists) {
          const fetchUsername = async () => {
            try {
              const res = await fetch(`/api/users/${otherUserId}`, {
                credentials: 'include'
              });
              if (res.ok) {
                const userData = await res.json();
                setUsers(p => p.map(u => 
                  u.id === otherUserId 
                    ? { ...u, username: userData.username, avatarUrl: userData.profileImageUrl }
                    : u
                ));
              }
            } catch (e) {
              console.error('Error fetching username:', e);
            }
          };
          fetchUsername();
          return [...prev, {
            id: otherUserId,
            username: otherUserId,
            lastMessage: lastMessage
          }];
        } else {
          return prev.map(u => 
            u.id === otherUserId 
              ? { ...u, lastMessage }
              : u
          );
        }
      });
    };
    
    socketInstance.on('connect', handleConnect);
    socketInstance.on('conversation:deleted', handleConversationDeleted);
    socketInstance.on('trade:sync', handleTradeSync);
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('conversation:deleted', handleConversationDeleted);
      socketInstance.off('trade:sync', handleTradeSync);
      socketInstance.disconnect();
    };
  }, [currentUserId, t]);
  
  // Unir el socket global a las salas de todos los usuarios activos al seleccionar uno
  useEffect(() => {
    if (!socket || !currentUserId || !selectedUserId) return;
    const roomId = [selectedUserId, currentUserId].sort().join('_');
    socket.emit('trade:join', { roomId });
  }, [socket, currentUserId, selectedUserId]);
  // Cargar propuesta desde la BD
  const loadTradeProposal = useCallback(async (userId: string) => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`/api/conversations/${userId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const conversation = await response.json();
          setIsChatLocked(!!conversation.isLocked);
          setLockReason(conversation.lockedReason || null);
        // Buscar el último mensaje de propuesta que NO sea del usuario actual
        if (conversation.messages && conversation.messages.length > 0) {
          // Filtrar todas las propuestas
          const allProposals = conversation.messages
            .filter((msg: any) => msg.kind === 'proposal')
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (allProposals.length > 0) {
            const lastProposal = allProposals[0];
            // Si la última propuesta es del usuario actual, significa que está esperando respuesta
            if (lastProposal.fromUserId === currentUserId) {
              setHasPendingProposal(true);
              // Seguimos mostrando la última propuesta enviada para que el usuario la vea mientras espera
              setReceivedProposal(lastProposal.payload);
            } else {
              // La última propuesta es del otro usuario
              setHasPendingProposal(false);
              setReceivedProposal(lastProposal.payload);
            }
          } else {
            setHasPendingProposal(false);
            setReceivedProposal(null);
          }
        } else {
          setHasPendingProposal(false);
          setReceivedProposal(null);
        }
      }
    } catch (error) {
      console.error('Error cargando propuesta de intercambio:', error);
    }
  }, [currentUserId]);
  // Refrescar datos del usuario seleccionado y rehidratar última propuesta
  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;
    fetchUserDetails(selectedUserId);
    loadTradeProposal(selectedUserId);
  }, [selectedUserId, currentUserId, fetchUserDetails, loadTradeProposal]);
  useEffect(() => {
    setIsChatLocked(false);
    setLockReason(null);
  }, [selectedUserId]);
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);
  const selectedUser = users.find(u => u.id === selectedUserId);
  const handleProposalReceived = useCallback((proposal: IProposalMessagePayload) => {
    setReceivedProposal(proposal);
    if (typeof window !== 'undefined' && roomId) {
      localStorage.setItem(`trade_last_proposal_${roomId}` , JSON.stringify(proposal));
    }
  }, [roomId]);
  const handleSendProposal = useCallback((proposal: IProposalMessagePayload) => {
    setPendingProposal(proposal);
    if (typeof window !== 'undefined' && roomId) {
      localStorage.setItem(`trade_last_proposal_${roomId}` , JSON.stringify(proposal));
    }
    // Limpiar después de un breve delay para asegurar que se procese
    setTimeout(() => {
      setPendingProposal(null);
      // Recargar la conversación para actualizar hasPendingProposal
      if (selectedUserId) {
        loadTradeProposal(selectedUserId);
      }
    }, 100);
  }, [roomId, selectedUserId, loadTradeProposal]);
  const handleConversationDeleted = useCallback((deletedUserId: string) => {
    // Eliminar de la lista de usuarios
    setUsers(prev => prev.filter(u => u.id !== deletedUserId));
    // Si el usuario eliminado estaba seleccionado, seleccionar el primero de la lista
    if (selectedUserId === deletedUserId) {
      setUsers(prev => {
        if (prev.length > 0) {
          setSelectedUserId(prev[0].id);
        } else {
          setSelectedUserId(null);
        }
        return prev;
      });
    }
    if (selectedUserId === deletedUserId) {
      setIsChatLocked(false);
      setLockReason(null);
    }
  }, [selectedUserId]);
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden">      
      {/* Header Global */}
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
          {/* COLUMNA 1: SIDEBAR (Lista de Chats) */}
          <aside className="w-1/4 min-w-[280px] border-r border-gray-800 bg-gray-900/50">
          <TradesSidebar
            users={users}
            loading={loading}
            error={null}
            selectedUserId={selectedUserId}
            onUserSelect={setSelectedUserId}
            onUserDeleted={handleConversationDeleted}
          />
        </aside>
        {/* ÁREA PRINCIPAL */}
        <main className="flex-1 flex flex-row overflow-hidden relative">
          {selectedUserId && selectedUser ? (
            <>
              {/* COLUMNA 2: DETALLE DEL INTERCAMBIO (Centro) */}
              <section className="flex-1 bg-gray-800/30 p-6 overflow-y-auto flex items-center justify-center relative">
                {/* Pasamos el ID del usuario como si fuera el ID del trade 
                   para que el componente cargue los datos mock correspondientes 
                */}
                <TradesDetail 
                  tradeId={selectedUserId}
                  roomId={roomId || undefined}
                  currentUserId={currentUserId || undefined}
                  targetUserId={selectedUserId}
                  targetUsername={selectedUser.username}
                  targetUserAvatar={selectedUser.avatarUrl}
                  onSendProposal={handleSendProposal}
                  receivedProposal={receivedProposal}
                  hasPendingProposal={hasPendingProposal}
                  onConversationDeleted={handleConversationDeleted}
                  isLocked={isChatLocked}
                  lockReason={lockReason}
                  onLocked={(reason) => {
                    setIsChatLocked(true);
                    setLockReason(reason);
                  }}
                  socket={socket}
                />
              </section>
              {/* COLUMNA 3: CHAT Y ACCIONES (Derecha) */}
              <aside className="w-[350px] bg-gray-900 h-full border-l border-gray-800">
                <TradesChat 
                  userId={selectedUser.id} 
                  username={selectedUser.username}
                  avatarUrl={selectedUser.avatarUrl}
                  roomId={roomId || undefined}
                  currentUserId={currentUserId || undefined}
                  onProposalReceived={handleProposalReceived}
                  pendingProposal={pendingProposal}
                  onProposalSent={() => setPendingProposal(null)}
                  socket={socket}
                  isLocked={isChatLocked}
                  lockReason={lockReason}
                  onLocked={(reason) => {
                    setIsChatLocked(true);
                    setLockReason(reason);
                  }}
                />
              </aside>
            </>
          ) : (
            // Estado vacío (si no hay selección)
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <span className="text-6xl opacity-50">💬</span>
              <p className="text-lg">Selecciona una propuesta para ver los detalles.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}