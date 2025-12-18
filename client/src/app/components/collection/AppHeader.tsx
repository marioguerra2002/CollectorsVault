"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import NotificationModal from '@/app/components/modals/notificationModal';
import { useTranslations } from '@/hooks/useTranslations';
// import { io, Socket } from 'socket.io-client'; // YA NO NECESITAS io AQUÍ
import { socket } from '@/lib/socket'; // <--- Importamos la instancia única

// Iconos...
const BellIcon = () => <span>🔔</span>;
const UserIcon = () => <span className="text-2xl">👤</span>;

export default function AppHeader() {
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // ❌ BORRADO: const [socket, setSocket] = useState<Socket | null>(null); 
  // Ya no usamos estado para el socket, usamos la variable importada directamente.

  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const getLinkClass = (path: string) => {
    // ... (tu lógica de estilos igual) ...
    const isActive = pathname === path;
    const baseClasses = "text-sm font-medium transition-all duration-200 pb-1 border-b-2";
    return isActive 
      ? `${baseClasses} text-white border-blue-500` 
      : `${baseClasses} text-gray-300 border-transparent hover:text-white hover:border-gray-500`;
  };

  // --- CARGAR FOTO DEL USUARIO ---
  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const res = await fetch(`/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAvatarUrl(data.profileImageUrl);
          setCurrentUserId(data._id);
        }
      } catch (error) {
        console.error("Error cargando avatar header:", error);
      }
    };
    fetchUserAvatar();
  }, []);

  // --- LÓGICA DEL SOCKET SINGLETON ---
  useEffect(() => {
    if (!currentUserId) return;

    // 1. Conectamos explícitamente la instancia importada
    if (!socket.connected) {
      socket.connect();
    }

    // 2. Definimos manejadores
    const handleConnect = () => {
      console.log("Socket conectado:", socket.id);
      socket.emit('user:subscribe', { userId: currentUserId });
    };

    const handleTradeSync = (msg: any) => {
      setHasNotifications(true);
    };

    // 3. Suscripciones (Usamos la variable 'socket' importada)
    socket.on('connect', handleConnect);
    socket.on('trade:sync', handleTradeSync);

    // Si ya estaba conectado (porque venimos de otra página), nos suscribimos manual
    if (socket.connected) {
      handleConnect();
    }

    // 4. Limpieza
    return () => {
      socket.off('connect', handleConnect);
      socket.off('trade:sync', handleTradeSync);
      // NO desconectamos aquí para mantener la conexión viva al navegar
    };
  }, [currentUserId]);

  // ... Resto de manejadores (handleNotificationClick, etc) igual ...
  const handleNotificationClick = () => {
    setIsNotificationModalOpen(true);
  };
  const handleNotificationClose = () => {
    setIsNotificationModalOpen(false);
    setHasNotifications(false);
  };
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchTerm.trim()) {
       router.push(`/owners?q=${encodeURIComponent(searchTerm)}`);
       setSearchTerm(''); 
    }
  };
  return (
    <header className="flex items-center justify-between w-full p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      {/* Parte Izquierda: Logo y Navegación */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link href="/collection" className="flex items-center gap-3 text-xl font-bold text-white">
          <Image src="/logo.png" alt="Collector's Vault logo" width={40} height={40} className="object-contain" />
          <span className="hidden md:inline">Collector&apos;s Vault</span>
        </Link>
        {/* Enlaces de Navegación */}
        <nav className="hidden md:flex gap-6">
          <Link href="/collection" className={getLinkClass('/collection')}>
            {t('header.collection')}
          </Link>
          <Link href="/wishlist" className={getLinkClass('/wishlist')}>
            {t('header.wishlist')}
          </Link>
          <Link href="/explore" className={getLinkClass('/explore')}>
            {t('header.explore')}
          </Link>
          <Link href="/trades" className={getLinkClass('/trades')}>
            {t('header.trades')}
          </Link>
        </nav>
      </div>
      {/* Parte Derecha: Acciones y Perfil */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className="text-gray-400 hover:text-white transition-colors relative p-2 rounded-lg hover:bg-gray-700"
          >
            <BellIcon />
            {/* Indicador de notificación */}
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          {/* Modal de notificaciones */}
          <NotificationModal 
            isOpen={isNotificationModalOpen}
            onClose={handleNotificationClose}
            currentUserId={currentUserId || undefined}
            socket={socket}
          />
        </div>
        <div className="relative hidden sm:block">
          <input 
            type="text"
            placeholder={t('header.search', 'Buscar carta...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="
              bg-gray-700 
              text-white 
              pl-4 pr-3 py-2
              rounded-lg
              text-sm
              w-64
              focus:outline-none
              focus:ring-2
              focus:ring-blue-600
              focus:bg-gray-600
              placeholder-gray-400
              transition-all
            "
          />
        </div>
        {/* ICONO DE USUARIO / PERFIL */}
        <Link href="/profile" className="relative group">
        {/* Añadimos un borde condicional también al avatar si estamos en /profile */}
          <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all bg-gray-700 flex items-center justify-center ${
            pathname === '/profile' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-600 group-hover:border-blue-400'
          }`}>            
          {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt="Avatar de usuario" 
                width={40} 
                height={40} 
                className="object-cover w-full h-full"
                unoptimized // Importante para URLs externas dinámicas
              />
            ) : (
              <UserIcon />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}