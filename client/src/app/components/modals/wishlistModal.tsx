'use client';
import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import Loader from '../ui/loader';
import NotFoundError from '../ui/notfoundError';
interface AddWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cardId: string) => Promise<void>;
}
interface SearchResult {
  id: string;
  name: string;
  image?: string;
  category?: string;
}
export default function AddWishlistModal({ isOpen, onClose, onAdd }: AddWishlistModalProps) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  if (!isOpen) return null;
  // Usar t() en los textos de la interfaz:
  // t('wishlistModal.title'), t('wishlistModal.searchPlaceholder'), t('wishlistModal.addButton'), t('wishlistModal.cancelButton'), t('wishlistModal.noResults')
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setIsSearching(true);
    try {
      const response = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${searchTerm}`);
      const data = await response.json();
      const mappedResults = (data || [])
        .filter((c: any) => c.image)
        .slice(0, 12)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          image: `${c.image}/low.png`,
          category: c.category
        }));
      setResults(mappedResults);
    } catch (error) {
      console.error("Error buscando:", error);
    } finally {
      setIsSearching(false);
    }
  };
  const handleAddClick = async (cardId: string) => {
    setIsAdding(cardId);
    await onAdd(cardId); // Aquí llamará a la función de wishlist
    setIsAdding(null);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-gray-700 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('wishlistModal.title')} ❤️</h2>
            <p className="text-gray-400 text-sm">{t('wishlist.cardsYouWant')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg">
            <span className="text-2xl">✕</span>
          </button>
        </div>
        <div className="p-6 bg-gray-800 border-b border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder={t('wishlistModal.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder-gray-500"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? t('addCardModal.searching') : t('addCardModal.searchButton')}
            </button>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900/30">
          {/* LÓGICA DE RENDERIZADO CONDICIONAL */}
          {isSearching ? (
            // CASO 1: Cargando (Usamos tu componente Loader)
            <div className="flex justify-center items-center h-full">
              <Loader />
            </div>
          ) : results.length === 0 ? (
            // CASO 2: No hay resultados
            hasSearched ? (
              // 2A: Ya buscó y no encontró nada -> NotFoundError (Tu componente de la TV)
              <div className="flex justify-center items-center h-full">
                <NotFoundError />
              </div>
            ) : (
              // 2B: Aún no ha buscado nada -> Mensaje de bienvenida
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                <span className="text-6xl mb-4">✨</span>
                <p className="text-lg">{t('wishlist.startAdding')}</p>
              </div>
            )
          ) : (
            // CASO 3: Hay resultados -> Grid de cartas
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((card) => (
                <div key={card.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col gap-4 group hover:border-pink-500/50 hover:shadow-lg transition-all">
                  <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={card.image} 
                      alt={card.name} 
                      className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-white font-medium text-sm truncate mb-1" title={card.name}>{card.name}</h3>
                    <button
                      onClick={() => handleAddClick(card.id)}
                      disabled={isAdding === card.id}
                      className="w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/20"
                    >
                      {isAdding === card.id ? t('addCardModal.saving') : `❤️ ${t('wishlistModal.addButton')}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}