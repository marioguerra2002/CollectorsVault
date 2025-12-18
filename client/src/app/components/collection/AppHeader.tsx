"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import NotificationModal from '@/app/components/modals/notificationModal';
import { useTranslations } from '@/hooks/useTranslations';
import { io, Socket } from 'socket.io-client';
// Iconos (idealmente los reemplazarías por iconos reales de 'react-icons')
const BellIcon = () => <span>🔔</span>;
const UserIcon = () => <span className="text-2xl">👤</span>; // Fallback por si no hay foto
export default function AppHeader() {
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Estado para la foto
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    const baseClasses = "text-sm font-medium transition-all duration-200 pb-1 border-b-2";
    if (isActive) {
      return `${baseClasses} text-white border-blue-500`;
    } else {
      return `${baseClasses} text-gray-300 border-transparent hover:text-white hover:border-gray-500`;
    }
  };
  // --- CARGAR FOTO DEL USUARIO AL MONTAR ---
  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        // Hacemos una petición ligera para saber quién es el usuario
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Guardamos la URL de la foto (o null si no tiene)
          setAvatarUrl(data.profileImageUrl);
          setCurrentUserId(data._id);
        }
        // Si falla (ej. no logueado), simplemente no mostramos foto, mostramos icono
      } catch (error) {
        console.error("Error cargando avatar header:", error);
      }
    };
    fetchUserAvatar();
  }, []); // Se ejecuta solo una vez al cargar el header
  // --- INICIALIZAR SOCKET.IO ---
  useEffect(() => {
    if (!currentUserId) return;
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socketInstance.on('connect', () => {
      socketInstance.emit('user:subscribe', { userId: currentUserId });
    });
    // Escuchar nuevos mensajes para mostrar notificación
    socketInstance.on('trade:sync', (msg: any) => {
      setHasNotifications(true);
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, [currentUserId]);
  // Marcar como leído cuando se abre el modal
  const handleNotificationClick = () => {
    setIsNotificationModalOpen(true);
    // No limpiar el badge hasta que se cierre el modal
  };
  const handleNotificationClose = () => {
    setIsNotificationModalOpen(false);
    setHasNotifications(false);
  };
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (searchTerm.trim()) {
        // CAMBIO: Redirigir a la página de owners con lo que escribió el usuario
        // encodeURIComponent es importante por si escribe espacios o símbolos
        router.push(`/owners?q=${encodeURIComponent(searchTerm)}`);
        setSearchTerm(''); 
      }
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