'use client';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AddCardFromCollectionModal from './addCardFromColectionModal';
import AddCardFromOtherUserCollectionModal from './addCardFromOtherUserCollectionModal';
import Loader from '../ui/loader';
import { useTranslations } from '@/hooks/useTranslations';
// Icono de cerrar
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
// Icono de intercambio
const ExchangeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);
interface Card {
  _id?: string;
  id?: number | string;
  name: string;
  image: string;
  value?: number;
  condition?: string;
  isTradable?: boolean;
  category?: string;
}
interface TradeExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string; // ID del usuario al que se le quiere proponer el intercambio
  targetUsername: string; // Nombre del usuario objetivo
  targetUserAvatar?: string; // Avatar del usuario objetivo
  currentUserUsername: string; // Nombre del usuario actual
  currentUserAvatar?: string; // Avatar del usuario actual
  initialCard?: Card; // Carta inicial seleccionada del usuario objetivo (si viene de búsqueda)
}
export default function TradeExchangeModal({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  targetUserAvatar,
  currentUserUsername,
  currentUserAvatar,
  initialCard
}: TradeExchangeModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const [mySelectedCards, setMySelectedCards] = useState<Card[]>([]);
  const [theirSelectedCards, setTheirSelectedCards] = useState<Card[]>([]);
  const [isAddMyCardsModalOpen, setIsAddMyCardsModalOpen] = useState(false);
  const [isAddTheirCardsModalOpen, setIsAddTheirCardsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizeCard = useCallback((card: any): Card => {
    const normalizedId = (card?._id || card?.id || card?.cardId || card?.tcgdexId || '').toString();
    return {
      ...card,
      _id: normalizedId,
      id: normalizedId,
      image: card?.image || '',
      category: card?.category || 'Pokemon',
      condition: card?.condition || card?.state || 'Mint',
      isTradable: card?.isTradable ?? true,
    } as Card;
  }, []);
  const getCardId = useCallback((card: Card) => {
    return (card._id || card.id || (card as any).cardId || '').toString();
  }, []);
  const getCardKeys = useCallback((card: Card) => {
    const keys = [card._id, card.id, (card as any).cardId, card.tcgdexId];
    return keys.filter(Boolean).map((k) => k!.toString());
  }, []);
  useEffect(() => {
    if (!initialCard) return;
    setTheirSelectedCards([normalizeCard(initialCard)]);
  }, [initialCard, normalizeCard]);
  // Cargar la carta inicial desde sessionStorage si existe
  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedCard = sessionStorage.getItem('trade_selectedCard');
      if (storedCard) {
        const parsedCard = normalizeCard(JSON.parse(storedCard));
        setTheirSelectedCards(prev => prev.length > 0 ? prev : [parsedCard]);
        // Limpiar sessionStorage después de usarlo
        sessionStorage.removeItem('trade_selectedCard');
      }
    } catch (e) {
      console.error('Error loading trade card from session:', e);
    }
  }, [isOpen, normalizeCard]);
  const handleAddMyCard = (card: Card) => {
    const cardWithId = normalizeCard(card);
    setMySelectedCards(prev => [...prev, cardWithId]);
  };
  const handleAddTheirCard = (card: Card) => {
    const cardWithId = normalizeCard(card);
    setTheirSelectedCards(prev => [...prev, cardWithId]);
  };
  const handleRemoveMyCard = (cardId: string | number | undefined) => {
    if (!cardId) return;
    setMySelectedCards(prev => prev.filter(card => {
      const id = getCardId(card);
      return id !== cardId.toString();
    }));
  };
  const handleRemoveTheirCard = (cardId: string | number | undefined) => {
    if (!cardId) return;
    setTheirSelectedCards(prev => prev.filter(card => {
      const id = getCardId(card);
      return id !== cardId.toString();
    }));
  };
  const fixImageUrl = (url?: string) => {
    if (!url) return 'https://images.pokemontcg.io/base1/back.png';
    if (url.includes('assets.tcgdex.net')) {
      if (url.endsWith('/high.png') || url.endsWith('/low.png')) return url;
      return `${url}/high.png`;
    }
    return url;
  };
  const handleSubmitTrade = async () => {
    if (mySelectedCards.length === 0 || theirSelectedCards.length === 0) {
      alert(t('trades.selectCardsOnBothSides'));
      return;
    }
    setIsSubmitting(true);
    try {
      // Preparar los datos del intercambio
      const tradeData = {
        targetUserId,
        targetUsername,
        targetUserAvatar,
        theirCards: theirSelectedCards.map(card => ({
          _id: card._id || card.id || (card as any).cardId,
          name: card.name,
          image: card.image,
          condition: (card as any).condition || 'Mint',
          isTradable: card.isTradable || false,
          category: card.category || 'Pokemon'
        })),
        myCards: mySelectedCards.map(card => ({
          _id: card._id || card.id || (card as any).cardId,
          name: card.name,
          image: card.image,
          condition: (card as any).condition || 'Mint',
          isTradable: card.isTradable || false,
          category: card.category || 'Pokemon'
        }))
      };
      // Guardar los datos en sessionStorage
      sessionStorage.setItem('trade_exchange_data', JSON.stringify(tradeData));
      const targetUserData = {
        id: targetUserId,
        username: targetUsername,
        avatarUrl: targetUserAvatar,
        lastMessage: '📦 Nueva propuesta de intercambio'
      };
      // Guardar información del usuario objetivo para el sidebar
      sessionStorage.setItem('trade_target_user', JSON.stringify(targetUserData));
      // Limpiar la carta inicial de sessionStorage
      sessionStorage.removeItem('trade_selectedCard');
      // Navegar a la página de trades usando Next.js router
      router.push('/trades');
    } catch (error) {
      console.error('Error al enviar propuesta de intercambio:', error);
      alert(t('trades.errorSendingProposal'));
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 w-full max-w-6xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{t('trades.proposeExchangeWith')} {targetUsername}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>
        {/* Contenido principal */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex flex-row items-stretch justify-center gap-0 relative bg-gray-900/40 rounded-2xl border border-gray-800 p-2 min-h-[500px]">
            {/* ICONO CENTRAL */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gray-900 p-2 rounded-full border border-gray-700 shadow-xl">
              <ExchangeIcon />
            </div>
            {/* --- LADO IZQUIERDO (RECIBIR DE ELLOS) --- */}
            <div className="flex-1 flex flex-col items-center gap-4 p-4 border-r border-gray-700/50 border-dashed">
              {/* Cabecera Usuario */}
              <div className="flex items-center gap-3 mb-2 bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
                <div className="relative w-8 h-8">
                  <Image 
                    src={targetUserAvatar || 'https://i.pravatar.cc/150'} 
                    alt={targetUsername} 
                    fill
                    className="rounded-full object-cover border border-gray-500"
                    unoptimized
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-200">{t('trades.receiveFrom')} {targetUsername} ({theirSelectedCards.length})</h3>
              </div>
              {/* Botón para añadir cartas del otro usuario */}
              <button 
                className="w-full max-w-[280px] py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                onClick={() => setIsAddTheirCardsModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('trades.addCards')}
              </button>
              {/* GRID DE CARTAS */}
              <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 place-items-center">
                  {theirSelectedCards.map((card) => {
                    const cardId = getCardId(card);
                    return (
                      <div 
                        key={cardId} 
                        className="group w-full max-w-[140px] space-y-2"
                      >
                        <div className="relative aspect-[2.5/3.5] w-full">
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
                          onClick={() => handleRemoveTheirCard(cardId)}
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
            {/* --- LADO DERECHO (DAR DE MÍ) --- */}
            <div className="flex-1 flex flex-col items-center gap-4 p-4">
              {/* Cabecera Yo */}
              <div className="flex items-center gap-3 mb-2 bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
                <h3 className="text-lg font-bold text-gray-200">{t('trades.give')} ({mySelectedCards.length})</h3>
                <div className="relative w-8 h-8">
                  <Image 
                    src={currentUserAvatar || 'https://i.pravatar.cc/150'} 
                    alt={currentUserUsername} 
                    fill
                    className="rounded-full object-cover border border-blue-400"
                    unoptimized
                  />
                </div>
              </div>
              {/* Botón para añadir cartas */}
              <button 
                className="w-full max-w-[280px] py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                onClick={() => setIsAddMyCardsModalOpen(true)}
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
                        <div className="relative aspect-[2.5/3.5] w-full">
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
                          onClick={() => handleRemoveMyCard(cardId)}
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
        </div>
        {/* Modales internos */}
        <AddCardFromCollectionModal 
          isOpen={isAddMyCardsModalOpen}
          onClose={() => setIsAddMyCardsModalOpen(false)}
          onSelectCard={(card: any) => handleAddMyCard(card)}
          selectedCardIds={new Set(mySelectedCards.flatMap(getCardKeys))}
        />
        <AddCardFromOtherUserCollectionModal 
          isOpen={isAddTheirCardsModalOpen}
          onClose={() => setIsAddTheirCardsModalOpen(false)}
          onSelectCard={(card: any) => handleAddTheirCard(card)}
          selectedCardIds={new Set(theirSelectedCards.flatMap(getCardKeys))}
          userId={targetUserId}
          username={targetUsername}
        />
        {/* Footer con botones */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-700 bg-gray-800/50">
          <p className="text-sm text-gray-400">
            {mySelectedCards.length} {mySelectedCards.length !== 1 ? t('trades.cards') : t('trades.card')} {t('trades.toGive')}, {theirSelectedCards.length} {theirSelectedCards.length !== 1 ? t('trades.cards') : t('trades.card')} {t('trades.toReceive')}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={handleSubmitTrade}
              disabled={isSubmitting || mySelectedCards.length === 0 || theirSelectedCards.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                mySelectedCards.length === 0 || theirSelectedCards.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader />
                  <span>{t('trades.sending')}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t('trades.sendProposal')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
