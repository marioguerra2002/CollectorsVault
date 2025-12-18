'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// Asegúrate de que esta ruta sea correcta en tu proyecto
import AppHeader from '@/app/components/collection/AppHeader';
import { useTranslations } from '@/hooks/useTranslations';
export default function ProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Estados del usuario
  const [user, setUser] = useState({
    username: '',
    email: '',
    avatarUrl: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  // --- 1. CARGAR DATOS AL ENTRAR ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const userData = {
            username: data.username,
            email: data.email,
            // Si no tiene imagen, ponemos la de por defecto
            avatarUrl: data.profileImageUrl || 'https://images.pokemontcg.io/base1/4.png',
          };
          setUser(userData);
          setFormData(userData);
        } else {
          // Si no está logueado, redirigir al login
          router.push('/login');
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [router]);
  // --- 2. MANEJADORES (Handlers) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          profileImageUrl: formData.avatarUrl
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = {
            username: data.username,
            email: data.email,
            avatarUrl: data.profileImageUrl
        };
        setUser(updatedUser);
        setFormData(updatedUser);
        setIsEditing(false);
        alert("Perfil actualizado correctamente");
        // Recargar para actualizar el Header global también
        window.location.reload(); 
      } else {
        alert(data.message || "Error al actualizar");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error("Error logout:", error);
      router.push('/login');
    }
  };
  // --- 3. RENDERIZADO (Diseño Full Page) ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Header Global */}
      <AppHeader />
      {/* Contenido Principal */}
      <main className="flex-grow w-full max-w-6xl mx-auto p-6 md:p-12">
        {/* Cabecera de la Sección */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-gray-700 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('profile.myProfile')}</h1>
            <p className="text-gray-400 mt-1">{t('profile.manageIdentity')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-400 border border-red-900/50 bg-red-900/10 rounded-lg hover:bg-red-900/30 hover:text-red-300 transition-all"
          >
            <span className="text-xl">🚪</span>
            <span>{t('common.logout')}</span>
          </button>
        </div>
        {/* Estado de Carga */}
        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center text-gray-500 animate-pulse">
            {t('profile.loadingData')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* COLUMNA IZQUIERDA: Tarjeta Visual */}
            <div className="md:col-span-1">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col items-center text-center shadow-lg">
                <div className="relative group w-40 h-40 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-700 shadow-xl bg-gray-900">
                    {formData.avatarUrl ? (
                      <Image 
                        src={formData.avatarUrl} 
                        alt="Avatar" 
                        width={160} 
                        height={160} 
                        className="object-cover w-full h-full"
                        unoptimized // Permite cargar imágenes externas sin configurar dominios
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-4xl">👤</div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center border-4 border-blue-500/50 pointer-events-none">
                      <span className="text-xs font-bold text-white px-2">{t('profile.editUrl')}</span>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
                <p className="text-gray-400 text-sm mb-4">{user.email}</p>
                <div className="w-full border-t border-gray-700 pt-4 mt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">{t('profile.role')}</span>
                    <span className="text-green-400 font-medium">{t('profile.collector')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('profile.memberSince')}</span>
                    <span className="text-white">2024</span>
                  </div>
                </div>
              </div>
            </div>
            {/* COLUMNA DERECHA: Formulario de Edición */}
            <div className="md:col-span-2">
              <div className="bg-gray-800/50 rounded-2xl p-6 md:p-8 border border-gray-700/50 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">{t('profile.accountDetails')}</h3>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline flex items-center gap-1"
                    >
                      ✏️ {t('profile.editProfile')}
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                  {/* Nombre de Usuario */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">{t('auth.username')}</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl outline-none transition-all border ${
                        isEditing 
                          ? 'bg-gray-900 border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white' 
                          : 'bg-gray-900/50 border-gray-700 text-gray-300 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  {/* URL Avatar */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">
                      {t('profile.profileImageUrl')} {isEditing && <span className="text-xs text-gray-500">({t('profile.directImageLink')})</span>}
                    </label>
                    <input
                      type="text"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="https://..."
                      className={`w-full px-4 py-3 rounded-xl outline-none transition-all border ${
                        isEditing 
                          ? 'bg-gray-900 border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white' 
                          : 'bg-gray-900/50 border-gray-700 text-gray-500 cursor-not-allowed truncate'
                      }`}
                    />
                  </div>
                  {/* Email (Solo lectura) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">{t('auth.email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-gray-900/30 border border-gray-700/50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-600">{t('profile.emailCannotBeModified')}</p>
                  </div>
                </div>
                {/* Botones de Acción (Solo en edición) */}
                {isEditing && (
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-700 mt-8 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none justify-center"
                    >
                      {isSaving ? t('profile.savingChanges') : t('profile.saveChanges')}
                    </button>
                    <button 
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex-1 md:flex-none justify-center"
                    >
                      {t('profile.cancel')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}