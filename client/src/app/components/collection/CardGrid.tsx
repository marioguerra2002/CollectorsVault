'use client';
import Image from 'next/image';
import { useTranslations } from '@/hooks/useTranslations';
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
  const t = useTranslations();
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white">
      { /* Cuadrícula de cartas */ }
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cards.length > 0 ? (
          cards.map((card) => (
            <div key={card.id} className="relative group p-2 bg-gray-700/30 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 border border-gray-700"> 
              {/* Imagen y Click */}
              <div 
                className="cursor-pointer"
                onClick={() => onCardClick?.(card.id)}
              >
                <Image
                  src={card.imageUrl ?? '/placeholder.png'}
                  alt={card.name ?? 'Carta'}
                  width={200}
                  height={280}
                  className="rounded-lg w-full h-auto transition-transform duration-200 group-hover:scale-[1.02]"
                  unoptimized
                />
                <div className="mt-2 text-center">
                  <p className="text-sm font-light text-gray-400">{card.name}</p>
                  <p className="text-xs text-gray-200 font-mono">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(card.value)}
                  </p>
                </div>
              </div>
              {/* Controles de Estado y Trading */}
              <div className="mt-3 space-y-1">
                {/* 1. Condición (Solo Lectura) */}
                <div
                  className={`px-2 py-1 text-xs font-medium rounded-full text-center ${
                  card.condition === 'Mint'
                    ? 'bg-green-700/50 text-green-300'
                    : card.condition === 'Near Mint'
                    ? 'bg-blue-700/50 text-blue-300'
                    : card.condition === 'Excellent'
                    ? 'bg-cyan-700/50 text-cyan-200'
                    : card.condition === 'Good'
                    ? 'bg-yellow-700/50 text-yellow-300'
                    : card.condition === 'Light Played'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : card.condition === 'Played'
                    ? 'bg-orange-700/50 text-orange-300'
                    : card.condition === 'Poor'
                    ? 'bg-red-700/50 text-red-300'
                    : 'bg-gray-700/50 text-gray-300'
                  }`}
                >
                  {t(`collection.conditions.${card.condition}`, card.condition || 'Mint')}
                </div>
                {/* 2. TOGGLE DE INTERCAMBIO (Botón) */}
                {onToggleTradable && (
                    <button
                        // Pasa el ID y el estado ACTUAL al handler
                        onClick={async () => {
                          try {
                            await onToggleTradable(card.id, card.isTradable || false);
                          } catch (error) {
                            alert('Fallo al actualizar el estado de intercambio.');
                          }
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            card.isTradable 
                            ? 'bg-green-600 border-green-700 text-white hover:bg-green-500' 
                            : 'bg-gray-600 border-gray-700 text-gray-300 hover:bg-gray-500'
                        }`}
                    >
                        {card.isTradable ? `✅ ${t('collection.tradable')}` : `❌ ${t('collection.notTradable')}`}
                    </button>
                )}
                {/* 3. Botón de Eliminar */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(card.id)}
                    className="w-full mt-1 inline-block px-2 py-1 text-xs bg-red-600 rounded-lg text-white hover:bg-red-500 transition-colors"
                  >🗑️</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-6 text-center text-gray-400 p-8">No hay cartas para mostrar.</p>
        )}
      </div>
    </div>  
  );
}