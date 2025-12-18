'use client';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from '@/hooks/useTranslations';

export default function Header() {
  const t = useTranslations();

  return (
    <header className="bg-[#2c3138] text-white shadow-lg">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        {/* Logo/Title */}
        <Link href="/" className="text-2xl font-bold">
          Collector's Vault
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/collection" className="hover:text-blue-400 transition-colors">
            {t('header.collection')}
          </Link>
          <Link href="/explore" className="hover:text-blue-400 transition-colors">
            {t('header.explore')}
          </Link>
          <Link href="/wishlist" className="hover:text-blue-400 transition-colors">
            {t('header.wishlist')}
          </Link>
          <Link href="/trades" className="hover:text-blue-400 transition-colors">
            {t('header.trades')}
          </Link>
          <Link href="/profile" className="hover:text-blue-400 transition-colors">
            {t('header.profile')}
          </Link>
        </nav>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
