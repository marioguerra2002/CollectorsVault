'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import LanguageSwitcher from './LanguageSwitcher';
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const router = useRouter(); // <-- 2. INICIALIZAR EL ROUTER
  const t = useTranslations();
  const handleSubmit = async (formE: React.FormEvent) => {
    formE.preventDefault();
    setError('');
    setLoading(true);
    if (!email || !password) {
        setError(t('auth.allFieldsRequired'));
        setLoading(false);
        return;
    }
    try {

      const response = await fetch(`/api/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }), 
        credentials: 'include'
      });
      const data = await response.json(); 
      if (!response.ok) {
        setError(data.message || t('auth.loginError'));
        setLoading(false); // Asegúrate de parar el loading en caso de error
        return;
      }
      // --- 4. CAMBIO CLAVE: Usar el router en lugar de alert() ---
      // ¡Inicio de sesión exitoso!
      router.push('/collection'); // Redirige al usuario a su colección
    } catch (err) {
      setError(t('auth.loginError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // --- ESTRUCTURA JSX CON TAILWIND CSS (SIN CAMBIOS) ---
  // Tu diseño se mantiene intacto
  return (
    // Contenedor de la "tarjeta"
    <div className="relative flex flex-col items-center p-8 bg-[#2c3138] rounded-xl w-full max-w-md shadow-lg text-white">
      {/* Language Switcher - Top Right Corner */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      {/* Logo */}
      <Image 
        src="/logo.png" // Asume que 'logo.png' está en 'client/public/'
        alt="Logo de Collector's Vault" 
        width={300} // Tamaño visual (Tailwind 'w-24' es 96px)
        height={300}
        className="mb-6" // Margen inferior
      />
      {/* Pestañas de Navegación */}
      <div className="flex gap-6 mb-6">
        <button 
          className="bg-blue-600 text-white py-2 px-5 rounded-lg font-semibold"
        >
          {t('auth.login')}
        </button>
        <Link 
          href="/register" 
          className="text-gray-400 py-2 px-5 rounded-lg font-semibold hover:text-white"
        >
          {t('auth.register')}
        </Link>
      </div>
      {/* Título */}
      <h1 className="text-white text-3xl font-bold mb-8">
        {t('auth.signIn')}
      </h1>
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
        <input
          type="text"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          // Clases de Tailwind para el input
          className="bg-[#1e1f22] text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          // Clases de Tailwind para el input
          className="bg-[#1e1f22] text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
        />
       <button 
          type="submit" 
          disabled={loading}
          // --- CLASES DE TAILWIND MODIFICADAS ---
          className="
            bg-transparent                   
            border border-blue-600          
            text-blue-600                   
            font-bold p-3 rounded-md        
            hover:bg-blue-600               
            hover:text-white                
            disabled:opacity-50             
            mt-4                            
            transition-colors
            text-center                     
          "
        >
          {loading ? t('auth.loggingIn') : t('auth.login')}
        </button>
      </form>
    </div>
  );
}