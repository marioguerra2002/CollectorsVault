'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Loader from '../ui/loader';
import NotFoundError from '../ui/notfoundError';
// Icono de cerrar
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
interface Card {
  _id: string;
  id?: string;
  cardId?: string;
  tcgdexId?: string;
  name: string;
  image?: string;
  condition?: string;
  rarity?: string;
  isTradable?: boolean;
  category?: string;
}
interface AddCardFromOtherUserCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
  selectedCardIds?: Set<string>;
  userId?: string; // ID del usuario del que queremos ver las cartas
  username?: string; // Nombre del usuario para mostrar en el modal
}
export default function AddCardFromOtherUserCollectionModal({ 
  isOpen, 
  onClose, 
  onSelectCard,
  selectedCardIds = new Set(),
  userId,
  username = 'Usuario'
}: AddCardFromOtherUserCollectionModalProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const getCardId = (card: Card) => {
    return (card._id || (card as any).id || (card as any).cardId || card.tcgdexId || '').toString();
  };
  const getCardKeys = (card: Card) => {
    const keys = [card._id, (card as any).id, (card as any).cardId, card.tcgdexId];
    return keys.filter(Boolean).map((k) => k!.toString());
  };
  // Cargar las cartas intercambiables de la colección del otro usuario
  useEffect(() => {
    if (!isOpen || !userId) return;
    const fetchUserCollectionCards = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/collection/${userId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          // Filtrar solo las cartas marcadas como intercambiables y que no estén ya seleccionadas
          const tradeableCards = data.filter((card: Card) => {
            const keys = getCardKeys(card);
            const alreadySelected = keys.some((k) => selectedCardIds.has(k));
            return card.isTradable === true && !alreadySelected;
          });
          setCards(tradeableCards);
        } else {
          setError('Error al cargar la colección del usuario');
        }
      } catch (err) {
        console.error('Error fetching user collection:', err);
        setError('Error al cargar las cartas');
      } finally {
        setLoading(false);
      }
    };
    fetchUserCollectionCards();
  }, [isOpen, selectedCardIds, userId]);
  const handleSelectCard = (card: Card) => {
    const cardId = getCardId(card);
    if (!cardId) return;
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };
  const handleAddSelectedCards = () => {
    const cardsToAdd = cards.filter(card => selectedCards.has(getCardId(card)));
    cardsToAdd.forEach(card => onSelectCard(card));
    setSelectedCards(new Set());
    onClose();
  };
  const fixImageUrl = (url?: string) => {
    if (!url) return '/placeholder.png';
    if (url.includes('assets.tcgdex.net')) {
      if (url.endsWith('/high.png') || url.endsWith('/low.png')) return url;
      return `${url}/high.png`;
    }
    return url;
  };
  const getConditionClasses = (cond?: string) => {
    const c = (cond || 'Mint').toString().trim();
    return c === 'Mint'
      ? 'bg-green-700/50 text-green-300 border-green-800'
      : c === 'Near Mint'
      ? 'bg-blue-700/50 text-blue-300 border-blue-800'
      : c === 'Excellent'
      ? 'bg-cyan-700/50 text-cyan-200 border-cyan-800'
      : c === 'Good'
      ? 'bg-yellow-700/50 text-yellow-300 border-yellow-800'
      : c === 'Light Played'
      ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800'
      : c === 'Played'
      ? 'bg-orange-700/50 text-orange-300 border-orange-800'
      : c === 'Poor'
      ? 'bg-red-700/50 text-red-300 border-red-800'
      : 'bg-gray-700/50 text-gray-300 border-gray-700';
  };
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Cartas intercambiables de {username}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>
        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-10">
              <p className="text-xl">⚠️</p>
              <p>{error}</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p className="text-lg">Este usuario no tiene cartas marcadas como intercambiables</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cards.map((card) => (
                <div 
                  key={getCardId(card)}
                  onClick={() => handleSelectCard(card)}
                  className={`relative group p-2 rounded-xl shadow-lg transition-all duration-200 border-2 cursor-pointer ${
                    selectedCards.has(getCardId(card))
                      ? 'bg-blue-900/40 border-blue-500 shadow-blue-500/20'
                      : 'bg-gray-700/30 border-gray-700 hover:shadow-blue-500/20 hover:border-blue-500/50'
                  }`}
                >
                  {/* Checkmark para cartas seleccionadas */}
                  {selectedCards.has(getCardId(card)) && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-4 h-4">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                  )}
                  {/* Imagen */}
                  <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg">
                    <Image
                      src={fixImageUrl(card.image)}
                      alt={card.name}
                      fill
                      className="object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                      unoptimized
                    />
                  </div>
                  {/* Información */}
                  <div className="mt-2 text-center">
                    <p className="text-sm font-light text-gray-300 truncate">{card.name}</p>
                    <div className="mt-1 flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium inline-block ${getConditionClasses(card.condition)}`}>
                        {card.condition || 'Mint'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer con botones */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-700 bg-gray-800/50">
          <p className="text-sm text-gray-400">
            {selectedCards.size} carta{selectedCards.size !== 1 ? 's' : ''} seleccionada{selectedCards.size !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddSelectedCards}
              disabled={selectedCards.size === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedCards.size === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Añadir {selectedCards.size > 0 ? `(${selectedCards.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
