'use client';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleSelectLanguage = (lang: 'en' | 'es') => {
    setLocale(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Main Dropdown Button */}
      <button
        onClick={toggleDropdown}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
      >
        {locale === 'en' ? 'English' : 'Español'}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[#2c3138] border border-gray-600 rounded-lg shadow-lg z-50">
          <button
            onClick={() => handleSelectLanguage('en')}
            className={`w-full px-4 py-3 text-left transition-colors ${
              locale === 'en'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleSelectLanguage('es')}
            className={`w-full px-4 py-3 text-left transition-colors ${
              locale === 'es'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Español
          </button>
        </div>
      )}
    </div>
  );
}
