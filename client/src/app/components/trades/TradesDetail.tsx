'use client';
import Image from 'next/image';
import NotFoundError from '../ui/notfoundError';
import Loader from '../ui/loader';
import CardDetailModal from '../modals/CardDetailModal';
import AddCardFromCollectionModal from '../modals/addCardFromColectionModal';
import AddCardFromOtherUserCollectionModal from '../modals/addCardFromOtherUserCollectionModal';
import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { IProposalMessagePayload, ITradeSide } from '@/app/types/trades';
import { useTranslations } from '@/hooks/useTranslations';
// 1. ACTUALIZAMOS EL MOCK A ARRAYS
interface Card {
  _id?: string;
  id?: number | string;
  cardId?: string | number;
  tcgdexId?: string;
  name: string;
  image: string;
  value?: number;
  condition?: string;
  isTradable?: boolean;
  category?: string;
  owner?: Owner;
}
// Import the Card type from the modal instead, or ensure compatibility
// Check that addCardFromColectionModal.tsx uses the same Card interface
interface Owner {
  _id: string;
  username: string;
  profileImageUrl?: string;
}
const MOCK_OFFER: { theirCards: Card[]; myCards: Card[] } = {
  theirCards: [
    {
      id: 'base1-58',
      name: 'Pikachu Base Set',
      image: 'https://images.pokemontcg.io/base1/58.png',
      value: 200
    },
    {
      id: 'base1-63',
      name: 'Squirtle Base Set',
      image: 'https://images.pokemontcg.io/base1/63.png',
      value: 50
    }
  ],
  myCards: [
    {
      id: 'swsh3-20',
      name: 'Charizard VMAX',
      image: 'https://images.pokemontcg.io/swsh3/20.png',
      value: 230
    },
    {
      id: 'base1-104',
      name: 'Darkness Energy',
      image: 'https://images.pokemontcg.io/base1/104.png',
      value: 5
    },
    {
      id: 'base1-94',
      name: 'Potion',
      image: 'https://images.pokemontcg.io/base1/94.png',
      value: 2
    }
  ]
};
// Icono de intercambio
const ExchangeIcon = () => (
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gray-900 p-2 rounded-full border border-gray-700 shadow-xl">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  </div>
);
interface TradeDetailProps {
  tradeId: string | number;
  roomId?: string;
  currentUserId?: string;
  targetUserId?: string;
  targetUsername?: string;
  targetUserAvatar?: string;
  onSendProposal?: (proposal: IProposalMessagePayload) => void;
  receivedProposal?: IProposalMessagePayload | null;
  hasPendingProposal?: boolean;
  onConversationDeleted?: (userId: string) => void;
  isLocked?: boolean;
  lockReason?: 'accepted' | 'deleted' | null;
  onLocked?: (reason: 'accepted' | 'deleted') => void;
  socket?: Socket | null;
}
export default function TradesDetail({ 
  tradeId,
  roomId,
  currentUserId,
  targetUserId,
  targetUsername,
  targetUserAvatar,
  onSendProposal,
  receivedProposal,
  hasPendingProposal = false,
  onConversationDeleted,
  isLocked = false,
  lockReason = null,
  onLocked,
  socket
}: TradeDetailProps) {
  const t = useTranslations();
  // move hooks inside component
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isAddOtherUserCardModalOpen, setIsAddOtherUserCardModalOpen] = useState(false);
  const [mySelectedCards, setMySelectedCards] = useState<Card[]>([]);
  const [theirSelectedCards, setTheirSelectedCards] = useState<Card[]>([]);
  const [localTargetUserId, setLocalTargetUserId] = useState<string | null>(targetUserId || null);
  const [localTargetUsername, setLocalTargetUsername] = useState<string | null>(targetUsername || null);
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    username: string;
    profileImageUrl?: string;
  } | null>(null);
  const [localTargetAvatar, setLocalTargetAvatar] = useState<string | null>(targetUserAvatar || null);
  const [activeProposal, setActiveProposal] = useState<IProposalMessagePayload | null>(null);
  const [isCurrentUserProposer, setIsCurrentUserProposer] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState<boolean>(isLocked);
  const [lockedReason, setLockedReason] = useState<'accepted' | 'deleted' | null>(lockReason);
  useEffect(() => {
    setIsChatLocked(!!isLocked);
  }, [isLocked]);
  useEffect(() => {
    setLockedReason(lockReason);
  }, [lockReason]);
  const normalizeCard = useCallback((card: any): Card => {
    // Mantener _id original si existe (ObjectId de MongoDB)
    // Si no, usar otros identificadores
    const mongoId = card?._id?.toString();
    const normalizedId = mongoId || (card?.id || card?.cardId || card?.tcgdexId || '').toString();
    return {
      ...card,
      _id: card?._id || normalizedId, // Preservar _id de MongoDB si existe
      id: card?.id || normalizedId, // TCGdex ID
      image: card?.image || '',
      category: card?.category || 'Pokemon',
      condition: card?.condition || card?.state || 'Mint',
      isTradable: card?.isTradable ?? true,
    } as Card;
  }, []);
  const getCardId = useCallback((card: Card) => {
    // Priorizar _id de MongoDB sobre otros IDs
    // Si _id es un ObjectId de MongoDB (24 caracteres hex), usarlo
    const mongoId = card._id?.toString();
    if (mongoId && /^[a-f\d]{24}$/i.test(mongoId)) {
      return mongoId;
    }
    // Fallback a otros IDs
    return (card._id || (card as any).cardId || card.id || '').toString();
  }, []);
  const getCardKeys = useCallback((card: Card) => {
    const keys = [card._id, card.id, (card as any).cardId, card.tcgdexId];
    return keys.filter(Boolean).map((k) => k!.toString());
  }, []);
  const mapCategoryToCardType = useCallback((category: string): 'PokemonCard' | 'TrainerCard' | 'EnergyCard' => {
    if (category?.toLowerCase().includes('trainer')) return 'TrainerCard';
    if (category?.toLowerCase().includes('energy')) return 'EnergyCard';
    return 'PokemonCard';
  }, []);
  useEffect(() => {
    if (targetUserId) setLocalTargetUserId(targetUserId);
    if (targetUsername) setLocalTargetUsername(targetUsername);
    if (targetUserAvatar) setLocalTargetAvatar(targetUserAvatar);
  }, [targetUserId, targetUsername, targetUserAvatar]);
  // Cargar la carta seleccionada desde sessionStorage
  useEffect(() => {
    try {
      // Primero intentamos cargar los datos del intercambio completo
      // imprimir el tamaño de sessionStorage
      const exchangeData = sessionStorage.getItem('trade_exchange_data');
      if (exchangeData) {
        const parsedData = JSON.parse(exchangeData);
        // Guardar información del usuario objetivo
        if (parsedData.targetUserId) {
          setLocalTargetUserId(parsedData.targetUserId);
        }
        if (parsedData.targetUsername) {
          setLocalTargetUsername(parsedData.targetUsername);
        }
        if (parsedData.targetUserAvatar) {
          setLocalTargetAvatar(parsedData.targetUserAvatar);
        }
        // Cargar cartas del otro usuario
        if (parsedData.theirCards && Array.isArray(parsedData.theirCards)) {
          setTheirSelectedCards(parsedData.theirCards.map(normalizeCard));
        }
        // Cargar cartas propias
        if (parsedData.myCards && Array.isArray(parsedData.myCards)) {
          setMySelectedCards(parsedData.myCards.map(normalizeCard));
        }
        // Limpiar los datos después de usarlos
        sessionStorage.removeItem('trade_exchange_data');
        sessionStorage.removeItem('trade_selectedCard');
      } else {
        // Si no hay datos de intercambio, intentamos cargar una carta única
        const storedCard = sessionStorage.getItem('trade_selectedCard') || sessionStorage.getItem('trade_theirCard');
        if (storedCard) {
          const parsedCard = normalizeCard(JSON.parse(storedCard));
          setTheirSelectedCards([parsedCard]);
          if (parsedCard.owner?._id) {
            setLocalTargetUserId(parsedCard.owner._id);
          }
          if (parsedCard.owner?.username) {
            setLocalTargetUsername(parsedCard.owner.username);
          }
          if (parsedCard.owner?.profileImageUrl) {
            setLocalTargetAvatar(parsedCard.owner.profileImageUrl);
          }
          sessionStorage.removeItem('trade_selectedCard');
          sessionStorage.removeItem('trade_theirCard');
        }
      }
    } catch (e) {
      console.error('Error loading trade card:', e);
    }
  }, [normalizeCard]);
  // Procesar propuesta recibida
  useEffect(() => {
    console.log('TradesDetail: useEffect receivedProposal ejecutado', {
      receivedProposal,
      currentUserId,
      hasProposal: !!receivedProposal
    });
    if (!receivedProposal) {
      return;
    }
    setActiveProposal(receivedProposal);
    setIsCurrentUserProposer(receivedProposal.proposer.userId === currentUserId);
    const fetchCardDetails = async (cardId: string, ownerId: string) => {
      try {
        // El backend expone /api/collection?userId=<ownerId>
        const response = await fetch(`/api/collection?userId=${ownerId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const collectionData = await response.json();
          // collectionData es un array de cartas
          const card = collectionData.find((c: any) => c._id === cardId || c.id === cardId);
          if (card) {
            return {
              id: card._id || card.id,
              name: card.name,
              image: card.image || card.imageUrl,
              category: card.category || 'Pokemon',
              condition: card.condition || 'Mint',
              isTradable: card.isTradable !== false
            };
          }
          console.warn(`Card ${cardId} not found in user ${ownerId} collection`);
        } else {
          console.error(`Failed to fetch collection for user ${ownerId}:`, response.status);
        }
      } catch (error) {
        console.error(`Error fetching card ${cardId}:`, error);
      }
      return null;
    };
    const loadProposalCards = async () => {
      if (!receivedProposal || !receivedProposal.proposer || !receivedProposal.receiver) {
        console.warn('Propuesta incompleta, se omite carga de cartas');
        return;
      }
      // Determinar si soy receptor o emisor
      const isReceiver = receivedProposal.receiver?.userId === currentUserId;
      // Cargar las cartas del proposer
      const proposerCardsPromises = (receivedProposal.proposer?.cards || []).map(card => 
        fetchCardDetails(card.cardId, receivedProposal.proposer?.userId || '')
      );
      const proposerCards = await Promise.all(proposerCardsPromises);
      // Cargar las cartas del receiver
      const receiverCardsPromises = (receivedProposal.receiver?.cards || []).map(card => 
        fetchCardDetails(card.cardId, receivedProposal.receiver?.userId || '')
      );
      const receiverCards = await Promise.all(receiverCardsPromises);
      // Filtrar nulls
      const validProposerCards = proposerCards.filter(c => c !== null);
      const validReceiverCards = receiverCards.filter(c => c !== null);
      const normalizedProposerCards = (validProposerCards as Card[]).map(normalizeCard);
      const normalizedReceiverCards = (validReceiverCards as Card[]).map(normalizeCard);
      if (isReceiver) {
        setTheirSelectedCards(normalizedProposerCards);
        setMySelectedCards(normalizedReceiverCards);
      } else {
        setTheirSelectedCards(normalizedReceiverCards);
        setMySelectedCards(normalizedProposerCards);
      }
    };
    loadProposalCards();
  }, [receivedProposal, currentUserId, normalizeCard]);
  // Cargar información del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);
  const fixImageUrl = (url?: string) => {
    if (!url) return 'https://images.pokemontcg.io/base1/back.png';
    if (url.includes('assets.tcgdex.net')) {
      if (url.endsWith('/high.png') || url.endsWith('/low.png')) return url;
      return `${url}/high.png`;
    }
    return url;
  };
  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardId(null);
  };
  const handleAddCardFromCollection = (card: Card) => {
    const cardWithId = normalizeCard(card);
    setMySelectedCards(prev => {
      const next = [...prev, cardWithId];
      // Si hay una propuesta activa y el usuario es el receptor, al modificar se reinician flags
      if (activeProposal && !isCurrentUserProposer) {
        setActiveProposal({
          ...activeProposal,
          proposer: { ...activeProposal.proposer, accepted: false },
          receiver: { ...activeProposal.receiver, accepted: false },
        });
      }
      return next;
    });
  };
  const handleAddCardFromOtherUserCollection = (card: Card) => {
    const cardWithId = normalizeCard(card);
    setTheirSelectedCards(prev => {
      const next = [...prev, cardWithId];
      if (activeProposal && !isCurrentUserProposer) {
        setActiveProposal({
          ...activeProposal,
          proposer: { ...activeProposal.proposer, accepted: false },
          receiver: { ...activeProposal.receiver, accepted: false },
        });
      }
      return next;
    });
  };
  const handleRemoveCard = (cardId: string | number | undefined) => {
    if (!cardId) return;
    setMySelectedCards(prev => {
      const filtered = prev.filter(card => {
      const id = getCardId(card);
        return id !== cardId.toString();
      });
      if (activeProposal && !isCurrentUserProposer) {
        setActiveProposal({
          ...activeProposal,
          proposer: { ...activeProposal.proposer, accepted: false },
          receiver: { ...activeProposal.receiver, accepted: false },
        });
      }
      return filtered;
    });
  };
  const handleRemoveOtherUserCard = (cardId: string | number | undefined) => {
    if (!cardId) return;
    setTheirSelectedCards(prev => {
      const filtered = prev.filter(card => {
        const id = getCardId(card);
        return id !== cardId.toString();
      });
      if (activeProposal && !isCurrentUserProposer) {
        setActiveProposal({
          ...activeProposal,
          proposer: { ...activeProposal.proposer, accepted: false },
          receiver: { ...activeProposal.receiver, accepted: false },
        });
      }
      return filtered;
    });
  };
  const emitSystemLockMessage = useCallback((reason: 'accepted' | 'deleted') => {
    const targetId = localTargetUserId || targetUserId;
    if (!socket || !roomId || !currentUserId || !targetId) return;
    const text = reason === 'accepted'
      ? 'Propuesta aceptada, puede eliminar el chat'
      : 'Propuesta eliminada, puede eliminar el chat';
    socket.emit('trade:message', {
      roomId,
      kind: 'system',
      payload: { text, reason },
      createdAt: Date.now(),
      fromUserId: currentUserId,
      toUserId: targetId,
      meta: { skipPersist: true },
    });
  }, [socket, roomId, currentUserId, localTargetUserId, targetUserId]);
  const lockConversation = useCallback(async (reason: 'accepted' | 'deleted') => {
    const targetId = localTargetUserId || targetUserId;
    if (!targetId) return false;
    try {
      const response = await fetch(`/api/conversations/${targetId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        console.error('No se pudo bloquear la conversación', response.statusText);
        return false;
      }
      setIsChatLocked(true);
      setLockedReason(reason);
      if (onLocked) onLocked(reason);
      emitSystemLockMessage(reason);
      return true;
    } catch (error) {
      console.error('Error bloqueando conversación:', error);
      return false;
    }
  }, [emitSystemLockMessage, localTargetUserId, onLocked, targetUserId]);
  const handleSendProposal = useCallback(async () => {
    if (isChatLocked) return;
    if (!currentUser?._id || !localTargetUserId) {
      alert('Faltan datos para enviar la propuesta');
      return;
    }
    if (mySelectedCards.length === 0) {
      alert(t('trades.mustSelectCard'));
      return;
    }
    const proposalPayload: IProposalMessagePayload = {
      tempTradeId: `trade_${Date.now()}`,
      proposer: {
        userId: currentUser._id,
        cards: mySelectedCards.map(card => ({
          cardType: mapCategoryToCardType((card as any).category || 'Pokemon'),
          cardId: getCardId(card),
        })),
        accepted: true,
      },
      receiver: {
        userId: localTargetUserId,
        cards: theirSelectedCards.map(card => ({
          cardType: mapCategoryToCardType((card as any).category || 'Pokemon'),
          cardId: getCardId(card),
        })),
        accepted: false,
      },
    };
    // Guardar la propuesta en la BD (tanto en lastTradeProposal como en mensajes)
    try {
      // 1. Guardar propuesta de intercambio
      await fetch(`/api/conversations/${localTargetUserId}/trade-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ proposal: proposalPayload })
      });
      setActiveProposal(proposalPayload);
      setIsCurrentUserProposer(true);
    } catch (error) {
      console.error('Error guardando propuesta en BD:', error);
    }
    onSendProposal?.(proposalPayload);
    // Limpiar las cartas después de enviar la propuesta
    setMySelectedCards([]);
    setTheirSelectedCards([]);
    sessionStorage.removeItem('trade_theirCard');
    sessionStorage.removeItem('trade_exchange_data');
    sessionStorage.removeItem('trade_selectedCard');
  }, [currentUser, localTargetUserId, mySelectedCards, theirSelectedCards, onSendProposal, getCardId, isChatLocked]);
  const handleAcceptProposal = useCallback(async () => {
    if (!activeProposal || !localTargetUserId || isChatLocked) return;
    if (isCurrentUserProposer) return; // Ya has aceptado al enviar
    const updatedProposal: IProposalMessagePayload = {
      ...activeProposal,
      proposer: { ...activeProposal.proposer, accepted: true },
      receiver: { ...activeProposal.receiver, accepted: true },
    };
    try {
      // 1. Actualizar la propuesta con ambas aceptaciones
      await fetch(`/api/conversations/${localTargetUserId}/trade-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ proposal: updatedProposal })
      });
      setActiveProposal(updatedProposal);
      // 2. Obtener el conversationId
      const conversationResponse = await fetch(`/api/conversations/${localTargetUserId}`, {
        credentials: 'include'
      });
      if (!conversationResponse.ok) {
        throw new Error('No se pudo obtener la conversación');
      }
      const conversation = await conversationResponse.json();
      if (!conversation._id) {
        throw new Error('No se encontró el ID de la conversación');
      }
      // 3. Ejecutar el intercambio
      const executeResponse = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: conversation._id })
      });
      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.error || 'Error ejecutando el intercambio');
      }
      const executeResult = await executeResponse.json();
      // 4. La conversación ya debería estar bloqueada por el backend
      // pero lo confirmamos en el frontend
      setIsChatLocked(true);
      setLockedReason('accepted');
      if (onLocked) onLocked('accepted');
    } catch (error) {
      console.error('Error aceptando propuesta:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [activeProposal, isCurrentUserProposer, localTargetUserId, isChatLocked, onLocked]);
  const handleRejectProposal = useCallback(async () => {
    if (!localTargetUserId || isChatLocked) return;
    try {
      const locked = await lockConversation('deleted');
      if (locked) {
        setActiveProposal(null);
        setTheirSelectedCards([]);
        setMySelectedCards([]);
      }
    } catch (error) {
      console.error('Error rechazando propuesta:', error);
    }
  }, [localTargetUserId, lockConversation, isChatLocked]);
  if (loading) return <div className="p-4 flex justify-center"><Loader /></div>;
  if (error) return <div className="p-4"><NotFoundError /></div>;
  // Si no hay carta seleccionada ni cartas del otro usuario seleccionadas, mostrar mensaje
  if (theirSelectedCards.length === 0 && mySelectedCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
        <span className="text-6xl opacity-50">🃏</span>
        <p className="text-lg">{t('trades.noActiveProposal')}</p>
        <p className="text-sm text-gray-500">{t('trades.goToProfile')}</p>
      </div>
    );
  }
  const proposerAccepted = activeProposal?.proposer.accepted ?? false;
  const receiverAccepted = activeProposal?.receiver.accepted ?? false;
  // Detectar si el receptor ha modificado la propuesta respecto a la activa
  const isReceiver = !isCurrentUserProposer;
  const normalizeIds = (cards: Card[]) => cards.map(getCardId).sort().join('|');
  const activeProposerIds = normalizeIds((activeProposal?.proposer.cards || []).map(c => ({ id: c.cardId })) as any);
  const activeReceiverIds = normalizeIds((activeProposal?.receiver.cards || []).map(c => ({ id: c.cardId })) as any);
  const currentTheirIds = normalizeIds(theirSelectedCards);
  const currentMyIds = normalizeIds(mySelectedCards);
  const hasModification = isReceiver && (
    activeProposerIds !== currentTheirIds || activeReceiverIds !== currentMyIds
  );
  const bothAccepted = proposerAccepted && receiverAccepted;
  const actionsDisabled = isChatLocked || bothAccepted || hasModification;
  return (
    <div className="w-full max-w-5xl h-full flex flex-col justify-center">
      {/* Modal de detalle */}
      <CardDetailModal 
        cardId={selectedCardId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      {/* Modal para añadir cartas de la colección */}
      <AddCardFromCollectionModal 
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onSelectCard={(card: any) => handleAddCardFromCollection(card)}
        selectedCardIds={new Set(mySelectedCards.map(card => {
          const cardId = getCardId(card);
          return cardId.toString();
        }))}
      />
      {/* Modal para añadir cartas del otro usuario */}
      <AddCardFromOtherUserCollectionModal 
        isOpen={isAddOtherUserCardModalOpen}
        onClose={() => setIsAddOtherUserCardModalOpen(false)}
        onSelectCard={(card: any) => handleAddCardFromOtherUserCollection(card)}
        selectedCardIds={new Set(theirSelectedCards.flatMap(getCardKeys))}
        userId={localTargetUserId || targetUserId || undefined}
        username={localTargetUsername || targetUsername || 'Usuario'}
      />
      {isChatLocked && (
        <div className="mt-4 text-center text-yellow-200 bg-gray-800 border border-yellow-600/60 rounded-lg px-4 py-2">
          {lockedReason === 'accepted'
            ? 'Propuesta aceptada, puede eliminar el chat'
            : 'Propuesta eliminada, puede eliminar el chat'}
        </div>
      )}
      {/* Contenedor de comparación */}
      <div className="flex flex-row items-stretch justify-center gap-0 relative bg-gray-900/40 rounded-2xl border border-gray-800 p-2 min-h-[500px]">
        {/* ICONO CENTRAL */}
        <ExchangeIcon />
        {/* --- LADO IZQUIERDO (RECIBIR) --- */}
        <div className="flex-1 flex flex-col items-center gap-4 p-4 border-r border-gray-700/50 border-dashed">
          {/* Cabecera Usuario */}
          <div className="flex items-center gap-3 mb-2 bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
            <div className="flex items-center gap-3">
              {localTargetAvatar && (
                <div className="relative w-8 h-8">
                  <Image 
                    src={localTargetAvatar} 
                    alt={localTargetUsername || 'Usuario'} 
                    fill
                    className="rounded-full object-cover border border-gray-500"
                    unoptimized
                  />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-200">{t('trades.receiveFrom')} {localTargetUsername || t('trades.unknownUser')} ({theirSelectedCards.length})</h3>
            </div>
          </div>
          {/* Botón para añadir cartas del otro usuario */}
          <button 
            className="w-full max-w-[280px] py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            onClick={() => setIsAddOtherUserCardModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('trades.addMoreCards')}
          </button>
          {/* GRID DE CARTAS */}
          <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 place-items-center">
              {/* Cartas adicionales seleccionadas del otro usuario */}
              {theirSelectedCards.map((card) => {
                const cardId = getCardId(card);
                return (
                  <div 
                    key={cardId} 
                    className="group w-full max-w-[140px] space-y-2"
                  >
                    <div 
                      className="relative aspect-[2.5/3.5] w-full cursor-pointer"
                      onClick={() => handleCardClick(cardId.toString())}
                    >
                      <Image 
                        src={fixImageUrl(card.image)} 
                        alt={card.name} 
                        fill
                        className="object-contain drop-shadow-lg transition-transform group-hover:scale-105"
                        unoptimized
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1 text-center rounded transition-opacity pointer-events-none">
                        State: {(card as any).condition || t('trades.noSpecified')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveOtherUserCard(cardId)}
                      className="w-full py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
                      title="Eliminar carta"
                    >
                      {t('trades.remove')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* --- LADO DERECHO (DAR) --- */}
        <div className="flex-1 flex flex-col items-center gap-4 p-4">
          {/* Cabecera Yo */}
          <div className="flex items-center gap-3 mb-2 bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
            <h3 className="text-lg font-bold text-gray-200">{t('trades.give')} ({mySelectedCards.length})</h3>
            <div className="relative w-8 h-8">
              <Image 
                src={currentUser?.profileImageUrl || 'https://i.pravatar.cc/150'} 
                alt={currentUser?.username || 'Usuario'} 
                fill
                className="rounded-full object-cover border border-blue-400"
                unoptimized
              />
            </div>
          </div>
          {/* Botón para añadir cartas */}
          <button 
            className="w-full max-w-[280px] py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            onClick={() => setIsAddCardModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('trades.addCards')}
          </button>
          {/* GRID DE CARTAS (SCROLLABLE) */}
          <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 place-items-center">
              {mySelectedCards.map((card) => {
                const cardId = getCardId(card);
                return (
                  <div 
                    key={cardId} 
                    className="group w-full max-w-[140px] space-y-2"
                  >
                    <div 
                      className="relative aspect-[2.5/3.5] w-full cursor-pointer"
                      onClick={() => handleCardClick(cardId.toString())}
                    >
                      <Image 
                        src={fixImageUrl(card.image)} 
                        alt={card.name} 
                        fill
                        className="object-contain drop-shadow-lg transition-transform group-hover:scale-105"
                        unoptimized
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1 text-center rounded transition-opacity pointer-events-none">
                        State: {(card as any).condition || t('trades.noSpecified')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCard(cardId)}
                      className="w-full py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
                      title="Eliminar carta"
                    >
                      {t('trades.remove')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Botón de enviar propuesta (debajo del contenedor de comparación) */}
      {activeProposal && (
        <div className="mt-6 text-center text-sm text-gray-300 space-y-1">
          {/* <div>
            Tu estado: {isCurrentUserProposer ? (proposerAccepted ? '✅ Ya aceptaste al proponer' : '⏳ Pendiente') : (proposerAccepted ? '✅ Proponente aceptó' : '⏳ Proponente pendiente')}
          </div>
          <div>
            Estado de {localTargetUsername || 'el otro usuario'}: {receiverAccepted ? '✅ Aceptó' : '⏳ Pendiente'}
          </div> */}
          {bothAccepted && (
            <div className="text-green-400 font-semibold">Intercambio realizado 🎉</div>
          )}
        </div>
      )}
      {activeProposal && !bothAccepted && (
        <div className="flex gap-3 mt-4 justify-center">
          <button
            onClick={handleAcceptProposal}
            disabled={isCurrentUserProposer || isChatLocked || hasModification}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isCurrentUserProposer || isChatLocked || hasModification
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {t('trades.acceptProposal')}
          </button>
          <button
            onClick={handleRejectProposal}
            disabled={isCurrentUserProposer || isChatLocked}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isCurrentUserProposer || isChatLocked
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {t('trades.deleteProposal')}
          </button>
        </div>
      )}
      {(mySelectedCards.length > 0 || theirSelectedCards.length > 0) && (
        <div className="flex flex-col gap-3 mt-6 justify-center items-center">
          {/* {hasPendingProposal && (
            <div className="text-yellow-400 text-sm font-medium">
              ⏳ Esperando respuesta del otro usuario...
            </div>
          )} */}
          <button
            onClick={handleSendProposal}
            disabled={hasPendingProposal || bothAccepted || isChatLocked}
            className={`px-8 py-3 font-bold rounded-lg transition-all shadow-lg transform duration-150 focus:outline-none focus:ring-2 flex items-center gap-2 ${
              (hasPendingProposal || bothAccepted || isChatLocked)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/30 hover:scale-105 focus:ring-blue-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {t('trades.sendProposal')}
          </button>
        </div>
      )}
    </div>
  );
}