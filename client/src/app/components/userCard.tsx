import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
interface UserCardProps {
  userId: string;
  username: string;
  avatarUrl?: string;
}
export default function UserCard({ userId, username, avatarUrl }: UserCardProps) {
  const t = useTranslations();
  // Imagen por defecto si no tiene avatar
  const imageSrc = avatarUrl || 'https://images.pokemontcg.io/base1/4.png';
  return (
    <Link href={`/user/${userId}`} className="block group">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-600 group-hover:border-blue-400 transition-colors">
            <Image 
              src={imageSrc} 
              alt={username} 
              width={64} 
              height={64} 
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">
            {username}
          </h3>
          <p className="text-gray-400 text-sm">{t('explore.collector', 'Collector')}</p>
        </div>
        {/* Flecha */}
        <div className="text-gray-500 group-hover:translate-x-1 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}