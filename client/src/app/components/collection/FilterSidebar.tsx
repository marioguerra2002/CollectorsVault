'use client';
import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
interface FilterSidebarProps {
  totalValue: string;
  totalCards: number;
  onFiltersChange?: (filters: {
    rarity: string[];
    condition: string[];
    cardType: string[];
    isTradable?: boolean;
  }) => void;
  showConditionFilter?: boolean;
  showTradableFilter?: boolean;
}
export default function FilterSidebar({ totalValue, totalCards, onFiltersChange, showConditionFilter = true, showTradableFilter = true }: FilterSidebarProps) {
  const t = useTranslations();
  type FilterKey = 'edicion' | 'rareza' | 'condicion' | 'tipo';
  type Filters = Record<FilterKey, boolean>;
  type SelectedFilters = {
    edition: string[];
    rarity: string[];
    condition: string[];
    cardType: string[];
    isTradable: boolean;
  };
  const [openFilter, setOpenFilter] = useState<Filters>({
    edicion: false,
    rareza: false,
    condicion: false,
    tipo: false,
  });
  // Estado: valores seleccionados
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    edition: [],
    rarity: [],
    condition: [],
    cardType: [],
    isTradable: false,
  });
  // ===========================
  // Cambiar el filtro visual (abrir/cerrar)
  // ===========================
  const toggleFilter = (filterName: FilterKey) => {
    setOpenFilter((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };
  // ===========================
  // Seleccionar o deseleccionar una opción
  // ===========================
  const toggleOption = (group: 'edition' | 'rarity' | 'condition' | 'cardType', value: string) => {
    setSelectedFilters((prev) => {
      const exists = prev[group].includes(value);
      return {
        ...prev,
        [group]: exists
          ? prev[group].filter((v: string) => v !== value)
          : [...prev[group], value],
      };
    });
  };
  const toggleTradableOnly = () => {
    setSelectedFilters((prev) => ({
      ...prev,
      isTradable: !prev.isTradable,
    }));
  };
  // ===========================
  // Aplicar filtros
  // ===========================
  const applyFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        rarity: selectedFilters.rarity,
        condition: selectedFilters.condition,
        cardType: selectedFilters.cardType,
        isTradable: selectedFilters.isTradable,
      });
    }
  };
  // ===========================
  // Limpiar filtros
  // ===========================
  const clearFilters = () => {
    setSelectedFilters({
      edition: [],
      rarity: [],
      condition: [],
      cardType: [],
      isTradable: false,
    });
    // Notificar al padre que no hay filtros
    if (onFiltersChange) {
      onFiltersChange({
        rarity: [],
        condition: [],
        cardType: [],
        isTradable: false,
      });
    }
  };
  // ===========================
  // UI principal
  // ===========================
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-white text-lg font-semibold mb-4 flex justify-between items-center gap-2">
        {t('collection.filters')}
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="bg-gray-600 px-3 py-1 rounded text-white text-sm hover:bg-gray-500"
            title={t('collection.clearFilters')}
          >
            {t('collection.clearFilters')}
          </button>
          <button
            onClick={applyFilters}
            className="bg-blue-500 px-3 py-1 rounded text-white text-sm hover:bg-blue-600"
          >
            {t('collection.applyFilters')}
          </button>
        </div>
      </h2>
      {showTradableFilter && (
        <div className="mb-4">
          <button
            onClick={toggleTradableOnly}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
              selectedFilters.isTradable
                ? 'border-green-500 bg-green-700/40 text-white'
                : 'border-gray-600 bg-gray-700 text-gray-200'
            }`}
          >
            <p className="text-sm font-semibold">{t('collection.tradable')}</p>
            <span
              className={`w-5 h-5 rounded border flex items-center justify-center text-sm ${
                selectedFilters.isTradable ? 'border-white bg-green-500 text-white' : 'border-gray-400'
              }`}
            >
              {selectedFilters.isTradable ? '✓' : ''}
            </span>
          </button>
        </div>
      )}
      {/* ===========================
          Filtro RAREZA
      =========================== */}
      <div className="flex justify-between items-center cursor-pointer"
        onClick={() => toggleFilter('rareza')}
      >
        <h3 className={`text-md font-medium ${openFilter.rareza ? 'text-white' : 'text-gray-400'}`}>
          {t('collection.rarity')}
          {selectedFilters.rarity.length > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedFilters.rarity.length}
            </span>
          )}
        </h3>
        <span className={`text-gray-500 text-xl transition-transform ${openFilter.rareza ? 'rotate-90' : ''}`}>
          {'>'}
        </span>
      </div>
      {openFilter.rareza && (
        <div className="mt-2 space-y-1">
          {[
            "Common",
            "Uncommon",
            "Rare",
            "Rare Double",
            "Rare Illustration",
            "Rare Special Illustration",
            "Rare Ultra",
            "Rare Hiper",
            "Reverse Holo",
            "Promo",
          ].map((ra) => {
            const isSelected = selectedFilters.rarity.includes(ra);
            const translatedLabel = t(`collection.rarities.${ra}`, ra);
            return (
              <div
                key={ra}
                onClick={() => toggleOption("rarity", ra)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all ${
                  isSelected 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <span className="text-sm">{translatedLabel}</span>
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  isSelected ? "border-white bg-white" : "border-gray-400"
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showConditionFilter && (
        <>
          <hr className="my-4 border-gray-700 mt-2" />
          {/* ===========================
              Filtro CONDICION
          =========================== */}
          <div className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleFilter('condicion')}
          >
            <h3 className={`text-md font-medium ${openFilter.condicion ? 'text-white' : 'text-gray-400'}`}> 
              {t('collection.condition')}
              {selectedFilters.condition.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedFilters.condition.length}
                </span>
              )}
            </h3>
            <span className={`text-gray-500 text-xl transition-transform ${openFilter.condicion ? 'rotate-90' : ''}`}> 
              {'>'}
            </span>
          </div>
          {openFilter.condicion && (
            <div className="mt-2 space-y-1">
              {[
                "Mint",
                "Near Mint",
                "Excellent",
                "Good",
                "Light Played",
                "Played",
                "Poor",
              ].map((co) => {
                const isSelected = selectedFilters.condition.includes(co);
                const translatedLabel = t(`collection.conditions.${co}`, co);
                return (
                  <div
                    key={co}
                    onClick={() => toggleOption("condition", co)}
                    className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <span className="text-sm">{translatedLabel}</span>
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isSelected ? "border-white bg-white" : "border-gray-400"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      <hr className="my-4 border-gray-700 mt-2" />
      {/* ===========================
          Filtro TIPO
      =========================== */}
      <div className="flex justify-between items-center cursor-pointer"
        onClick={() => toggleFilter('tipo')}
      >
        <h3 className={`text-md font-medium ${openFilter.tipo ? 'text-white' : 'text-gray-400'}`}>
          {t('collection.cardType')}
          {selectedFilters.cardType.length > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedFilters.cardType.length}
            </span>
          )}
        </h3>
        <span className={`text-gray-500 text-xl transition-transform ${openFilter.tipo ? 'rotate-90' : ''}`}>
          {'>'}
        </span>
      </div>
      {openFilter.tipo && (
        <div className="mt-2 space-y-1">
          {["Pokemon", "Trainer", "Energy"].map((tp) => {
            const isSelected = selectedFilters.cardType.includes(tp);
            const translatedLabel = t(`collection.cardTypes.${tp}`, tp);
            return (
              <div
                key={tp}
                onClick={() => toggleOption("cardType", tp)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all ${
                  isSelected 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <span className="text-sm">{translatedLabel}</span>
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  isSelected ? "border-white bg-white" : "border-gray-400"
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        <hr className="my-4 border-gray-700 mt-2" />      {/* ===========================
          Estadísticas
      =========================== */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{t('collection.totalValue')}</span>
        <span className="text-md font-semibold text-white">{totalValue}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{t('collection.cards')}</span>
        <span className="text-md font-semibold text-white">{totalCards}</span>
      </div>
    </div>
  );
}
