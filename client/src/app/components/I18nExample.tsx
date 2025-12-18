'use client';
/**
 * Este es un componente de EJEMPLO que muestra cómo usar el sistema de i18n
 * 
 * Puedes eliminarlo cuando hayas entendido cómo funciona
 */
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { FlagEN, FlagES } from './Flags';
export default function I18nExample() {
  const t = useTranslations();
  const { locale, setLocale } = useLanguage();
  return (
    <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Ejemplo de i18n</h2>
      <div className="space-y-4">
        {/* Mostrar idioma actual */}
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-400 text-sm">{t('common.language')}</p>
          <p className="text-white text-lg font-bold">{locale === 'en' ? 'English' : 'Español'}</p>
        </div>
        {/* Mostrar algunas traducciones */}
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-blue-400 font-bold mb-2">Traducciones de Ejemplo:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>✓ {t('header.collection')}</li>
            <li>✓ {t('header.explore')}</li>
            <li>✓ {t('header.trades')}</li>
            <li>✓ {t('auth.login')}</li>
          </ul>
        </div>
        {/* Botones para cambiar idioma */}
        <div className="flex gap-2">
          <button
            onClick={() => setLocale('en')}
            className={`flex-1 py-2 rounded font-bold transition-colors ${
              locale === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLocale('es')}
            className={`flex-1 py-2 rounded font-bold transition-colors ${
              locale === 'es'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Español
          </button>
        </div>
        {/* Instrucciones */}
        <div className="bg-blue-900/30 border border-blue-800 p-4 rounded text-blue-200 text-sm">
          <p className="font-bold mb-2">Cómo usar en tu código:</p>
          <code className="block bg-blue-950 p-2 rounded text-xs overflow-auto">
{`const t = useTranslations();
<h1>{t('header.collection')}</h1>`}
          </code>
        </div>
      </div>
    </div>
  );
}
