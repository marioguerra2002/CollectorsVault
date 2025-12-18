'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import AppHeader from '@/app/components/collection/AppHeader';
import FilterSidebar from '@/app/components/collection/FilterSidebar';
import CardGrid from '@/app/components/collection/CardGrid';
import AddCardModal from '@/app/components/modals/addCardModal';
import CardDetailModal from '../components/modals/CardDetailModal';
import Loader from '@/app/components/ui/loader';
import NotFoundError from '@/app/components/ui/notfoundError';
import { useTranslations } from '@/hooks/useTranslations';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
interface Card {
  id: string; // MongoDB _id
  tcgId?: string; // API TCG id
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
export function CollectionContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const targetUserId = searchParams.get('userId'); 
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // ...existing code...
  // Ejemplo de uso de traducciones en la UI principal:
  // t('collection.totalValue'), t('collection.cards'), t('collection.sortBy'), t('collection.sortByPrice'), t('collection.sortByName')
  // En la interfaz de añadir cartas (AddCardModal), pasar las traducciones como props o usar el hook dentro del modal.
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTargetUsername(data.username);
      } else {
        setTargetUsername('Usuario Desconocido');
      }
    } catch (e) {
      setTargetUsername('Error al obtener el nombre');
    }
  };
  const reloadCards = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = targetUserId ? `${apiUrl}/api/collection?userId=${targetUserId}` : `${apiUrl}/api/collection`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const mappedCards = (Array.isArray(data) ? data : []).map((c: ServerCard) => ({
          id: c._id,
          tcgId: c.id, // Guardar el ID de la API de TCG
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/api/collection/filter?${params.toString()}`;
    fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const mappedCards = (Array.isArray(data) ? data : []).map((c: ServerCard) => ({
          id: c._id,
          tcgId: c.id, // Guardar el ID de la API de TCG
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
        // Aplica el filtro en el cliente por si el backend devuelve sin filtrar
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const url = targetUserId ? `${apiUrl}/api/collection?userId=${targetUserId}` : `${apiUrl}/api/collection`;
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
        if (data.length > 0) {
          console.log('Primera carta ejemplo:', {
            _id: data[0]._id,
            id: data[0].id,
            name: data[0].name,
            category: data[0].category
          });
        }
        const mappedCards = (Array.isArray(data) ? data : []).map((c: ServerCard) => ({
          id: c._id,
          tcgId: c.id, // Guardar el ID de la API de TCG
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/cards/${cardId}/tradable`, {
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
      // Actualización optimista: Cambiamos el estado en ambos arrays
      const updateCard = (c: Card) => 
        c.id === idString ? { ...c, isTradable: !currentStatus } : c;
      setCards(prev => prev.map(updateCard));
      setFilteredCards(prev => prev.map(updateCard));
    } catch (err: any) {
      console.error(err);
      alert(`Fallo al actualizar el estado: ${err.message}`);
    }
  };
  // --- HANDLER DE AÑADIR CARTA (RECIBE CONDICIÓN Y TRADABLE) ---
  const handleAddCard = async (cardApiId: string, category: string, condition: string, isTradable: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/cards`, {
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
    if (!confirm("¿Eliminar carta de tu colección?")) return;
    const idString = String(cardId);
    const cardToDelete = cards.find(c => c.id === idString);
    const category = cardToDelete?.category || 'Pokemon';
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/cards/${idString}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category }) 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar');
      }
      // Eliminar de ambos arrays
      setCards(prev => prev.filter(c => c.id !== idString));
      setFilteredCards(prev => prev.filter(c => c.id !== idString));
    } catch (err) {
      console.error(err);
      alert(`No se pudo eliminar. ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };
  if (loading) return <Loader />; // PRIMERA VERIFICACIÓN DE CARGA/ERROR
  if (error) return <NotFoundError />;
  // Ordenar las cartas filtradas
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'price') {
      return b.value - a.value; // Mayor a menor
    } else {
      return (a.name || '').localeCompare(b.name || ''); // Alfabético
    }
  });
  const totalValueCalculated = calculateTotalValue(filteredCards);
  const collectionTitle = isViewingOwn 
    ? t('collection.myCollection')
    : t('collection.viewingCollection').replace('{username}', targetUsername || targetUserId || 'Usuario');
  const collectionSubtitle = isViewingOwn 
    ? t('collection.manageCards')
    : 'Colección pública de este coleccionista';
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
            <div>
              <h1 className="text-2xl font-bold text-white">{collectionTitle}</h1>
              <p className="text-gray-400 text-sm">{collectionSubtitle}</p>
            </div>
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
          {sortedCards.length > 0 ? (
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
                {cards.length === 0
                  ? (isViewingOwn ? t('collection.noCards') : 'Este usuario aún no tiene cartas.')
                  : 'No hay cartas que coincidan con los filtros seleccionados.'}
              </p>
              {isViewingOwn && cards.length === 0 && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 text-blue-400 hover:underline"
                >
                  {t('collection.startAdding')}
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
      <CardDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cardId={selectedCardId}
      />
    </div>
  );
}
export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10">  </div>}>
      <CollectionContent />
    </Suspense>
    
  );
}