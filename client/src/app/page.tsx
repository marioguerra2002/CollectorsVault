'use client';
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import { useLanguage } from "./providers/LanguageProvider";
import LanguageSwitcher from "./components/LanguageSwitcher";

export default function Home() {
  const t = useTranslations();
  const { locale } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#2c3138] to-black">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        {/* Centered Card Container */}
        <div className="relative w-full max-w-2xl bg-[#2c3138] rounded-lg p-8 md:p-12 shadow-lg">
          {/* Language Switcher - Top Right Corner */}
          <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>

          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Collector's Vault Logo"
            width={300}
            height={300}
            priority
            className="mb-8 mx-auto"
          />

          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Collector's Vault
            </h1>
            <p className="text-lg text-gray-300 mb-2">
              {locale === 'es' 
                ? 'Gestiona tu colección de cartas de Pokémon y más.' 
                : 'Manage your Pokémon card collection and more.'}
            </p>
            <p className="text-sm text-gray-400">
              {locale === 'es'
                ? 'Explora, intercambia y colecciona tus cartas favoritas'
                : 'Explore, trade, and collect your favorite cards'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors text-center"
            >
              {t('auth.register')}
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                {locale === 'es' ? 'Colección' : 'Collection'}
              </h3>
              <p className="text-gray-400 text-sm">
                {locale === 'es'
                  ? 'Organiza y gestiona tus cartas'
                  : 'Organize and manage your cards'}
              </p>
            </div>
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                {locale === 'es' ? 'Intercambios' : 'Trades'}
              </h3>
              <p className="text-gray-400 text-sm">
                {locale === 'es'
                  ? 'Intercambia cartas con otros coleccionistas'
                  : 'Trade cards with other collectors'}
              </p>
            </div>
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                {locale === 'es' ? 'Explorar' : 'Explore'}
              </h3>
              <p className="text-gray-400 text-sm">
                {locale === 'es'
                  ? 'Descubre nuevas cartas y usuarios'
                  : 'Discover new cards and users'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
