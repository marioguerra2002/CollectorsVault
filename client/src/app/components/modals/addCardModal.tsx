'use client';
import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
// Define el Enum aquí para la UI
const TypeConditionCard = {
  MINT: "Mint", NEAR_MINT: "Near Mint", EXCELLENT: "Excellent", 
  GOOD: "Good", LIGHT_PLAYED: "Light Played", PLAYED: "Played", POOR: "Poor"
};
const ConditionOptions = Object.values(TypeConditionCard);
interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onAdd ahora recibe category, condition y isTradable
  onAdd: (cardId: string, category: string, condition: string, isTradable: boolean) => Promise<void>; 
}
interface SearchResult {
  id: string;
  name: string;
  image?: string;
  category?: string;
}
export default function AddCardModal({ isOpen, onClose, onAdd }: AddCardModalProps) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  // Estados para el formulario de la carta SELECCIONADA
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);
  const [condition, setCondition] = useState<string>(TypeConditionCard.MINT);
  const [isTradable, setIsTradable] = useState(false);
  if (!isOpen) return null;
  // Usar t() en los textos de la interfaz:
  // t('addCardModal.title'), t('addCardModal.searchPlaceholder'), t('addCardModal.selectCondition'), t('addCardModal.tradable'), t('addCardModal.addButton'), t('addCardModal.cancelButton'), t('addCardModal.noResults')
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSelectedCard(null); // Limpiar selección anterior
    setResults([]);
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
  const handleSelectCard = (card: SearchResult) => {
    // Cuando el usuario selecciona una carta, la movemos a la vista de configuración
    setSelectedCard(card);
    setResults([]); // Limpiamos resultados
    setSearchTerm(card.name);
  };
  const handleFinalAdd = async () => {
    if (!selectedCard) return;
    // Log para debug - ver qué categoría estamos enviando
    console.log('📤 Enviando carta al backend:', {
      id: selectedCard.id,
      name: selectedCard.name,
      category: selectedCard.category,
      categoryFallback: selectedCard.category || 'Pokemon'
    });
    setIsAdding(selectedCard.id);
    // Si no hay categoría, mejor no enviar nada y dejar que el backend la obtenga de la API
    await onAdd(
      selectedCard.id, 
      selectedCard.category || '', // Enviar string vacío en lugar de 'Pokemon'
      condition, 
      isTradable
    );
    setIsAdding(null);
    setSelectedCard(null); // Limpiamos la vista tras añadir
    setSearchTerm('');
    setCondition(TypeConditionCard.MINT);
    setIsTradable(false);
  };
  const handleBackToSearch = () => {
    setSelectedCard(null);
    setSearchTerm('');
    // No limpiamos los resultados para que pueda volver a ellos si quiere
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-gray-700 overflow-hidden">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('addCardModal.title')}</h2>
            <p className="text-gray-400 text-sm">{t('addCardModal.subtitle', 'Busca y configura los detalles de tu copia.')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">✕</button>
        </div>
        {/* Buscador y Navegación */}
        <div className="p-6 bg-gray-800 border-b border-gray-700">
          {selectedCard ? (
            <button onClick={handleBackToSearch} className="text-blue-400 hover:underline text-sm mb-4 flex items-center gap-1">
              &larr; {t('addCardModal.backToResults', 'Back to results')}
            </button>
          ) : (
            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                placeholder={t('addCardModal.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                autoFocus
              />
              <button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                {isSearching ? t('addCardModal.searching', 'Buscando...') : t('addCardModal.searchButton', 'Buscar')}
              </button>
            </form>
          )}
        </div>
        {/* --- CONTENIDO PRINCIPAL: CONFIGURACIÓN O RESULTADOS --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900/30">
          {/* VISTA 1: CONFIGURACIÓN DE ESTADO */}
          {selectedCard ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Columna Izquierda: Carta seleccionada */}
              <div className="md:col-span-1 flex flex-col items-center">
                <h3 className="text-xl font-bold mb-4 text-white">{selectedCard.name}</h3>
                <div className="relative w-full max-w-xs aspect-[2.5/3.5] rounded-lg overflow-hidden border-4 border-blue-500 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedCard.image} alt={selectedCard.name} className="w-full h-full object-contain" />
                </div>
              </div>
              {/* Columna Derecha: Formulario de Estado */}
              <div className="md:col-span-2 space-y-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">{t('addCardModal.detailsTitle', 'Card Copy Details')}</h3>
                {/* 1. Condición de la Carta */}
                <div className="space-y-2">
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-400">{t('addCardModal.conditionLabel', 'Physical Condition')}</label>
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ConditionOptions.map(cond => (
                      <option key={cond} value={cond}>{t(`collection.conditions.${cond}`, cond)}</option>
                    ))}
                  </select>
                </div>
                {/* 2. Intercambiabilidad (Toggle) */}
                <div className="flex items-center justify-between border-t border-gray-700 pt-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">{t('addCardModal.tradableLabel', 'Available for Trade')}</label>
                    <p className="text-xs text-gray-500">{t('addCardModal.tradableHint', 'If checked, other users can propose a trade for this card.')}</p>
                  </div>
                  <button 
                    onClick={() => setIsTradable(prev => !prev)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isTradable ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isTradable ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                {/* Botón Final */}
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={handleFinalAdd}
                    disabled={isAdding === selectedCard.id}
                    className="w-full py-3 px-6 rounded-lg text-lg font-bold transition-colors flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 disabled:bg-gray-600"
                  >
                    {isAdding === selectedCard.id ? t('addCardModal.saving', 'Saving...') : t('addCardModal.addButton', '+ Add to my Collection')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VISTA 2: LISTA DE RESULTADOS DE BÚSQUEDA */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.length === 0 && !isSearching ? (
                <div className="text-center text-gray-500 mt-10 col-span-full">
                  <span className="text-6xl mb-4">🔍</span>
                  <p className="text-lg">{t('addCardModal.noResults', 'Busca una carta para empezar')}</p>
                </div>
              ) : (
                results.map((card) => (
                  <div key={card.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700 flex flex-col gap-3 group hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => handleSelectCard(card)}>
                    <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-gray-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.image} alt={card.name} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-white font-medium text-sm text-center truncate" title={card.name}>{card.name}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectCard(card); }}
                      className="w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {t('addCardModal.chooseAndConfigure', 'Choose & Configure')}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}