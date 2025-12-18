'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; 
import AppHeader from '@/app/components/collection/AppHeader';
import FilterSidebar from '@/app/components/collection/FilterSidebar';
import CardGrid from '@/app/components/collection/CardGrid';
import AddCardModal from '@/app/components/modals/addCardModal';
import CardDetailModal from '../../components/modals/CardDetailModal';
import TradeExchangeModal from '@/app/components/modals/tradeExchangeModal';
import Loader from '../../components/ui/loader';
import NotFoundError from '../../components/ui/notfoundError';
import Image from 'next/image'; // Ensure Image is imported from next/image
import { useTranslations } from '@/hooks/useTranslations';
interface Card {
  id: string;
  tcgId?: string;
  name?: string;
  value: number;
  imageUrl?: string;
  category?: string;
  isTradable?: boolean; 
  condition?: string; 
}
interface ServerCard {
  _id: string;
  id?: string;
  name?: string;
  image?: string;
  category?: string;
  isTradable?: boolean; 
  condition?: string; 
  pricing?: {
    cardmarket?: { avgPrice?: number } | null;
    tcgplayer?: { normal?: { marketPrice?: number; avgHoloPrice?: number } } | null;
  } | null;
}
const calculateTotalValue = (cards: Card[]) => {
  const total = cards.reduce((sum, card) => sum + (card.value || 0), 0);
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total);
}
const fixImageUrl = (url?: string) => {
  if (!url) return 'https://images.pokemontcg.io/base1/back.png';
  if (url.includes('assets.tcgdex.net')) {
    if (!url.endsWith('/high.png') && !url.endsWith('/low.png')) {
      return `${url}/high.png`;
    }
  }
  return url;
};
export default function CollectionPage() {
  const t = useTranslations();
  const router = useRouter();
  const params =  useParams(); 
  const targetUserId = params.id as string || null; 
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [isTradeExchangeModalOpen, setIsTradeExchangeModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
  const [targetUserAvatar, setTargetUserAvatar] = useState<string | null>(null);
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'name'>('price');
  const isViewingOwn = !targetUserId;
  const handleCardClick = (cardId: string | number) => {
    // Buscar la carta para obtener su tcgId
    const card = filteredCards.find(c => c.id === String(cardId));
    setSelectedCardId(card?.tcgId || String(cardId)); 
    setIsDetailModalOpen(true);
  };
  const fetchTargetUsername = async (userId: string) => {
    try {
      // Endpoint /api/users/:userId devuelve username y profileImageUrl (lo creamos en un paso anterior)
      const res = await fetch(`/api/users/${userId}`); 
      if (res.ok) {
        const data = await res.json();
        setTargetUsername(data.username);
        // Capturamos el avatar
        setTargetUserAvatar(data.profileImageUrl || 'https://images.pokemontcg.io/base1/4.png'); 
      } else {
        setTargetUsername('Usuario Desconocido');
        setTargetUserAvatar(null);
      }
    } catch (e) {
      setTargetUsername('Error al obtener el nombre');
      setTargetUserAvatar(null);
    }
  };
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' }); 
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data._id);
        setCurrentUserUsername(data.username);
        setCurrentUserAvatar(data.profileImageUrl || 'https://i.pravatar.cc/150');
      }
    } catch (e) {
      console.error('Error fetching current user:', e);
    }
  };
  const reloadCards = async () => {
    try {
      const url = targetUserId ? `/api/collection/${targetUserId}` : '/api/collection';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const mappedCards = (Array.isArray(data) ? data : []).map((c: ServerCard) => ({
          id: c._id,
          tcgId: c.id,
          name: c.name,
          imageUrl: fixImageUrl(c.image),
          category: c.category,
          isTradable: c.isTradable || false, 
          condition: c.condition || 'Mint', 
          value: c.pricing?.cardmarket?.avgPrice 
              || c.pricing?.tcgplayer?.normal?.marketPrice 
              || c.pricing?.tcgplayer?.normal?.avgHoloPrice
              || 0,
        }));
        setCards(mappedCards);
        setFilteredCards(mappedCards);
      }
    } catch (err) {
      console.error("Error recargando:", err);
    }
  };
  // Función para manejar los filtros
  const handleFiltersChange = (filters: {
    rarity: string[];
    condition: string[];
    cardType: string[];
    isTradable?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters.rarity?.length > 0)
      params.append("rarity", filters.rarity.join(","));
    if (filters.condition?.length > 0)
      params.append("condition", filters.condition.join(","));
    if (filters.cardType?.length > 0)
      params.append("cardType", filters.cardType.join(","));
    if (filters.isTradable)
      params.append("isTradable", 'true');
    // Agregar userId si estamos viendo otra colección
    if (targetUserId) {
      params.append("userId", targetUserId);
    }
    // Si no hay filtros, mostrar todas las cartas
    if (params.toString() === '' || (targetUserId && params.toString() === `userId=${targetUserId}`)) {
      setFilteredCards(cards);
      return;
    }
    // Llamar al endpoint de filtrado
    const url = `/api/collection/filter?${params.toString()}`;
    fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const mappedCards = (Array.isArray(data) ? data : []).map((c: ServerCard) => ({
          id: c._id,
          tcgId: c.id,
          name: c.name,
          imageUrl: fixImageUrl(c.image),
          category: c.category,
          isTradable: c.isTradable || false,
          condition: c.condition || 'Mint',
          value: c.pricing?.cardmarket?.avgPrice
            || c.pricing?.tcgplayer?.normal?.marketPrice
            || c.pricing?.tcgplayer?.normal?.avgHoloPrice
            || 0,
        }));
        const tradableFiltered = filters.isTradable
          ? mappedCards.filter((c) => c.isTradable)
          : mappedCards;
        setFilteredCards(tradableFiltered);
      })
      .catch(err => {
        console.error('Error al filtrar:', err);
      });
  };
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const url = targetUserId ? `/api/collection/${targetUserId}` : '/api/collection';
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (!response.ok) {
          throw new Error('No se pudieron cargar las cartas.');
        }
        const data = await response.json();
      const mappedCards = (Array.isArray(data) ? data : []).map((c: ServerCard) => ({
        id: c._id,
        tcgId: c.id,
        name: c.name,
        imageUrl: fixImageUrl(c.image),
        category: c.category,
        isTradable: c.isTradable || false, 
        condition: c.condition || 'Mint', 
        value: c.pricing?.cardmarket?.avgPrice 
            || c.pricing?.tcgplayer?.normal?.marketPrice 
            || c.pricing?.tcgplayer?.normal?.avgHoloPrice
            || 0,
      }));
      setCards(mappedCards);
      setFilteredCards(mappedCards);        
      if (targetUserId) {
        fetchTargetUsername(targetUserId);
      }
      // Obtener usuario actual
      await fetchCurrentUser();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [router, targetUserId]);
  // --- HANDLER DE TOGGLE (PATCH) ---
  const handleToggleTradable = async (cardId: string, currentStatus: boolean) => {
    const idString = String(cardId);
    const cardToUpdate = cards.find(c => c.id === idString);
    const category = cardToUpdate?.category;
    if (!category) {
      alert("Error: No se pudo determinar el tipo de carta para actualizar.");
      return;
    }
    try {
      // LLAMAMOS AL ENDPOINT PATCH
      const res = await fetch(`/api/cards/${cardId}/tradable`, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTradable: !currentStatus, // El nuevo estado
          category: category // Pasamos la categoría al backend
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar estado.');
      }
      // Actualización optimista: Solo cambiamos el estado en la UI
      setCards(prev => prev.map(c => 
        c.id === idString ? { ...c, isTradable: !currentStatus } : c
      ));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Fallo al actualizar el estado: ${message}`);
    }
  };
  // --- HANDLER DE AÑADIR CARTA (RECIBE CONDICIÓN Y TRADABLE) ---
  const handleAddCard = async (cardApiId: string, category: string, condition: string, isTradable: boolean) => {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cardApiId,
          category: category,
          condition: condition, // <--- CAMPO ENVIADO
          isTradable: isTradable // <--- CAMPO ENVIADO
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
        return;
      }
      alert("¡Carta añadida a tu colección!");
      await reloadCards(); 
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };
  const handleRemove = async (cardId: string | number) => {
    // ... (lógica de borrado) ...
    if (!confirm("¿Eliminar carta de tu colección?")) return;
    const idString = String(cardId);
    const cardToDelete = cards.find(c => c.id === idString);
    const category = cardToDelete?.category || 'Pokemon';
    try {
      const res = await fetch(`/api/cards/${idString}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category }) 
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setCards(prev => prev.filter(c => c.id !== idString));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar. Revisa la consola.");
    }
  };
  if (loading) return <Loader />; // PRIMERA VERIFICACIÓN DE CARGA/ERROR
  if (error) return <NotFoundError />;
  const totalValueCalculated = calculateTotalValue(filteredCards);
  // Ordenar las cartas filtradas
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'price') {
      return b.value - a.value; // Mayor a menor
    } else {
      return (a.name || '').localeCompare(b.name || ''); // Alfabético
    }
  });
  const collectionTitle = isViewingOwn 
    ? t('collection.myCollection') 
    : t('collection.userCollection', `${targetUsername || targetUserId || 'User'}'s Collection`).replace('{username}', targetUsername || targetUserId || 'User');
  const collectionSubtitle = isViewingOwn 
    ? t('collection.manageCards') 
    : t('collection.publicCollection', 'Public collection of this collector');
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <AppHeader />
      <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <aside className="w-full md:w-1/4 space-y-6">
          <FilterSidebar 
            totalValue={totalValueCalculated} 
            totalCards={filteredCards.length}
            onFiltersChange={handleFiltersChange}
          />
        </aside>
        <main className="w-full md:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 gap-4">
            <div className="flex items-center gap-4">
                {/* 1. Imagen del Usuario Ajeno (Condicional) */}
                {!isViewingOwn && targetUserAvatar && (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 shrink-0">
                        <Image 
                            src={targetUserAvatar} 
                            alt={`Avatar de ${targetUsername}`} 
                            width={48} 
                            height={48} 
                            className="object-cover w-full h-full"
                            unoptimized
                        />
                    </div>
                )}
              <div>
              <h1 className="text-2xl font-bold text-white">{collectionTitle}</h1>
              <p className="text-gray-400 text-sm">{collectionSubtitle}</p>
              </div>
            </div>
            {/* Botones condicionales */}
            <div className="flex gap-2">
              {/* Botón de realizar intercambio solo aparece si NO es tu colección */}
              {!isViewingOwn && (
                <button 
                  onClick={() => setIsTradeExchangeModalOpen(true)}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span>{t('collection.performTrade')}</span>
                </button>
              )}
              {/* Botón de añadir solo aparece si es TU colección */}
              {isViewingOwn && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl leading-none">+</span>
                  <span>{t('collection.addCard')}</span>
                </button>
              )}
            </div>
          </div>
          {/* Selector de ordenamiento */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-400">{t('collection.sortBy')}:</span>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                sortBy === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t('collection.sortByPrice')}
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t('collection.sortByName')}
            </button>
          </div>
          {cards.length > 0 ? (
            <CardGrid 
              cards={sortedCards} 
              onRemove={isViewingOwn ? handleRemove : undefined}
              onCardClick={handleCardClick}
              // PASAMOS EL HANDLER DEL TOGGLE SOLO SI ES PROPIA
              onToggleTradable={isViewingOwn ? handleToggleTradable : undefined}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-gray-300">
                {isViewingOwn ? 'Tu colección está vacía.' : 'Este usuario aún no tiene cartas.'}
              </p>
              {isViewingOwn && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 text-blue-400 hover:underline"
                >
                  ¡Añade tu primera carta ahora!
                </button>
              )}
            </div>
          )}
        </main>
      </div>
      {isViewingOwn && (
        <AddCardModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddCard} 
        />
      )}
      {!isViewingOwn && targetUserId && targetUsername && (
        <TradeExchangeModal
          isOpen={isTradeExchangeModalOpen}
          onClose={() => setIsTradeExchangeModalOpen(false)}
          targetUserId={targetUserId}
          targetUsername={targetUsername}
          targetUserAvatar={targetUserAvatar || undefined}
          currentUserUsername={currentUserUsername || 'Usuario'}
          currentUserAvatar={currentUserAvatar || undefined}
        />
      )}
      <CardDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cardId={selectedCardId}
      />
    </div>
  );
}
