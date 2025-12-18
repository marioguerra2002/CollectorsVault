'use client';
import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import Image from 'next/image';
interface CardGridProps {
  cards: Card[];
  onRemove?: (cardId: string | number) => Promise<void>;
  onCardClick?: (cardId: string | number) => void;
  // Handler para el toggle (solo se usa si es colección propia)
  onToggleTradable?: (cardId: string, currentStatus: boolean) => Promise<void>; 
}
interface Card {
  id: string;
  name?: string;
  value: number;
  imageUrl?: string;
  isTradable?: boolean; 
  condition?: string;
}
export default function CardGrid({ cards, onRemove, onCardClick, onToggleTradable }: CardGridProps) {
  const [sortBy, setSortBy] = useState<'price' | 'name'>('price');
  const t = useTranslations();
  const sortedCards = cards ? [...cards].sort((a, b) => {
    if (sortBy === 'price') {
      return (b.value ?? 0) - (a.value ?? 0);
    } else {
      return (a.name ?? '').localeCompare(b.name ?? '');
    }
  }) : [];
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white">
      {/* Cabecera (titulo y ordenacion) */}
      <div className="text-xl justify-between items-center mb-6 flex">
        {/* Selector de ordenación */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{t('wishlist.sortBy')}:</span>
          <button 
            onClick={() => setSortBy('price')} 
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}>
            {t('wishlist.sortByPrice')}
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}>
            {t('wishlist.sortByName')}
          </button>
        </div>
      </div>
      {/* Cuadrícula de cartas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedCards.length > 0 ? (
          sortedCards.map((card) => (
            <div key={card.id} className="relative group p-2 bg-gray-700/30 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 border border-gray-700"> 
              {/* Imagen y Click */}
              <div 
                className="cursor-pointer"
                onClick={() => onCardClick?.(card.id)}
              >
                <Image
                  src={card.imageUrl ?? '/placeholder.png'}
                  alt={card.name ?? t('wishlist.cards')}
                  width={200}
                  height={280}
                  className="rounded-lg w-full h-auto transition-transform duration-200 group-hover:scale-[1.02]"
                  unoptimized
                />
                <div className="mt-2 text-center">
                  <p className="text-sm font-light text-gray-400">{card.name}</p>
                  <p className="text-xs text-gray-200 font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', currencyDisplay: 'symbol' }).format(card.value).replace('€', '€ ')}
                  </p>
                </div>
              </div>
                {/* 3. Botón de Eliminar */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(card.id)}
                    className="w-full mt-1 inline-block px-2 py-1 text-xs bg-red-600 rounded-lg text-white hover:bg-red-500 transition-colors"
                  >🗑️</button>
                )}
              </div>
          ))
        ) : (
          <p className="col-span-6 text-center text-gray-400 p-8">{t('wishlist.noWishlist')}</p>
        )}
      </div>
    </div>  
  );
}