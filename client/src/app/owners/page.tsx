'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AppHeader from '@/app/components/collection/AppHeader';
import Loader from '../components/ui/loader';
import NotFoundError from '../components/ui/notfoundError';
import { useTranslations } from '@/hooks/useTranslations';
// Definimos qué esperamos recibir del backend (Carta + Dueño)
interface Owner {
  _id: string;
  username: string;
  profileImageUrl?: string;
}
interface SearchResult {
  _id: string;
  tcgdexId?: string;
  name: string;
  image?: string;
  rarity?: string;
  owner: Owner; // <-- Esto viene gracias al .populate() del backend
  category: string;
  condition?: string;
  isTradable?: boolean;
}
export default function OwnersSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q'); // Leemos el texto de búsqueda de la URL
  const router = useRouter();
  const t = useTranslations();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const handleSelectForTrade = (item: SearchResult) => {
    try {
      if (!item.isTradable) {
        alert(t('owners.cardNotTradable'));
        if (item.owner?._id) {
          router.push(`/user/${item.owner._id}`);
        }
        return;
      }
      // Si es intercambiable, guardamos la carta y vamos al perfil del usuario
      const normalizedId = String(item._id || item.tcgdexId || '');
      const payload = {
        _id: normalizedId,
        id: normalizedId,
        cardId: normalizedId,
        tcgdexId: item.tcgdexId,
        name: item.name,
        image: item.image,
        category: item.category,
        condition: item.condition,
        rarity: item.rarity,
        isTradable: item.isTradable,
        owner: item.owner
      };
      try {
        sessionStorage.setItem('trade_selectedCard', JSON.stringify(payload));
      } catch (storageError) {
        console.error('Error guardando en sessionStorage:', storageError);
        alert(t('errors.somethingWentWrong'));
        return;
      }
      // Ir al perfil del usuario con la tarjeta seleccionada para intercambio
      router.push(`/user/${item.owner._id}`);
    } catch (e) {
      console.error('Error preparando trade:', e);
      alert(t('errors.somethingWentWrong'));
    }
  };
  // Devuelve clases CSS según el estado/condición de la carta
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
  // Traduce la condición de la carta
  const translateCondition = (cond?: string) => {
    const condition = cond || 'Mint';
    return t(`collection.conditions.${condition}`, condition);
  };
  // Traduce la rareza de la carta
  const translateRarity = (rarity?: string) => {
    if (!rarity) return '';
    return t(`collection.rarities.${rarity}`, rarity);
  };
  // Helper para arreglar imágenes (mismo que en colección)
  const fixImageUrl = (url?: string) => {
    if (!url) return 'https://images.pokemontcg.io/base1/back.png';
    // Si es de TCGdex, aseguramos que tenga extensión de calidad
    if (url.includes('assets.tcgdex.net')) {
      // Si ya tiene extensión de calidad, devolvemos tal cual
      if (url.endsWith('/high.png') || url.endsWith('/low.png')) return url;
      // Si no tiene extensión o termina raro, forzamos high.png
      return `${url}/high.png`;
    }
    return url;
  };
  useEffect(() => {
    // Obtener el usuario logueado para poder excluir sus propias cartas
    const fetchMe = async () => {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          setCurrentUserId(d._id || null);
          setCurrentUsername(d.username || null);
          return d;
        }
      } catch (e) {
        // no hacemos nada si no está logueado
      }
      return null;
    };
    const fetchOwners = async () => {
      if (!query) return;
      setLoading(true);
      setError('');
      try {
        // LLAMADA A TU NUEVA RUTA DEL BACKEND
        // const res = await fetch(`http://localhost:5000/api/cards/search-owners?name=${encodeURIComponent(query)}`, {
        //     credentials: 'include' // Importante para pasar la cookie de sesión
        // });
        const resp = await fetch(`/api/cards/search-owners?name=${encodeURIComponent(query)}`, {
            credentials: 'include' // Importante para pasar la cookie de sesión
        });
        const res = resp;
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error(`API Error: ${res.status}`, errorData);
          throw new Error(`Error al buscar cartas: ${res.status} - ${errorData.message || 'Unknown error'}`);
        }
        const data: SearchResult[] = await res.json();
        // Excluir cartas del usuario que realiza la búsqueda (por id o por username)
        const filtered = data.filter((item: any) => {
          if (!item.owner) return false;
          // Si coincide el id del owner con el usuario actual, excluir
          if (currentUserId && String(item.owner._id) === String(currentUserId)) return false;
          // Si coincide el username del owner con el username actual, excluir
          if (currentUsername && String(item.owner.username) === String(currentUsername)) return false;
          return true;
        });
        setResults(filtered);
      } catch (err) {
        console.error(err);
        setError(t('owners.errorSearching'));
      } finally {
        setLoading(false);
      }
    };
    // Esperamos a que sepamos quién es el usuario antes de buscar y filtrar
    (async () => {
      await fetchMe();
      await fetchOwners();
    })();
  }, [currentUserId, currentUsername, query, router]);
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <AppHeader />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('owners.resultsFor')} <span className="text-blue-400">"{query}"</span>
          </h1>
          <p className="text-gray-400">
            {t('owners.usersWithCard')}
          </p>
        </div>
        {/* ESTADOS DE CARGA / ERROR / SIN RESULTADOS */}
        {loading && <Loader />}
        {error && <NotFoundError />}
        {!loading && !error && results.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                <p className="text-2xl mb-2">{t('explore.noResultsIcon')}</p>
                <p>{t('owners.noOneHasCard')}</p>
            </div>
        )}
        {/* GRID DE RESULTADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item, index) => (
            <div 
              key={`${item._id}-${item.owner?._id}-${index}`} 
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex gap-4 hover:border-blue-500 transition-all group"            
            >
              {/* 1. La Carta */}
              <div className="relative w-24 shrink-0">
                <div 
                  role="button"
                  aria-label={`${t('owners.selectForTrade')} ${item.name}`}
                  onClick={() => handleSelectForTrade(item)}
                  className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg cursor-pointer">
                    <Image 
                        src={fixImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-contain rounded-lg shadow-lg"
                        unoptimized
                    />
                </div>
              </div>
              {/* 2. Info y Dueño */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-2">
                  <h3 className="text-white font-bold truncate text-lg" title={item.name}>{item.name}</h3>
                  {/* Fila 1: Categoría/Rareza y Condición */}
                  <div className="flex flex-wrap gap-2">
                    {/* Categoría/Rareza */}
                    <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-700">
                        {translateRarity(item.rarity) || item.category}
                    </span>
                    {/* Estado de la carta */}
                    <span className={`text-xs px-2 py-1 rounded border font-medium ${getConditionClasses(item.condition)}`}>
                      {translateCondition(item.condition)}
                    </span>
                  </div>
                  {/* Fila 2: Indicador de Intercambiable (siempre en su propia línea) */}
                  <div>
                    <span className={`inline-block text-xs px-2 py-1 rounded border font-medium ${item.isTradable ? 'bg-green-700/50 text-green-300 border-green-800' : 'bg-red-700/50 text-red-300 border-red-800'}`}>
                      {item.isTradable ? t('collection.tradable') : t('collection.notTradable')}
                    </span>
                  </div>
                </div>
                {/* El Dueño (Link a su perfil) */}
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">{t('owners.ownedBy')}</p>
                  <Link href={`/user/${item.owner?._id}`} className="flex items-center gap-2 hover:bg-gray-700/50 p-2 rounded-lg -mx-2 transition-colors">
                    <div className="relative w-8 h-8">
                      <Image 
                        src={item.owner?.profileImageUrl || 'https://i.pravatar.cc/150'}
                        alt={item.owner?.username || t('owners.unknownUser')}
                        fill
                        className="rounded-full object-cover border border-gray-500"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-300 truncate">
                      {item.owner?.username || t('owners.unknownUser')}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}