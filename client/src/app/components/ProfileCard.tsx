'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
export default function ProfileCard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState({
    username: '',
    email: '',
    avatarUrl: '', 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  // Cargar datos al iniciar
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const userData = {
            username: data.username,
            email: data.email,
            avatarUrl: data.profileImageUrl || 'https://images.pokemontcg.io/base1/4.png', 
          };
          setUser(userData);
          setFormData(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Error al obtener el perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [router]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Guardar cambios
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
        alert("¡Perfil actualizado con éxito!");
      } else {
        alert(data.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error de conexión al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };
  // --- FUNCIÓN DE CERRAR SESIÓN (LOGOUT) ---
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // No importa si la petición falla, redirigimos igual para "sacar" al usuario
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      router.push('/login');
    }
  };
  const handleCancel = () => {
    setFormData(user); 
    setIsEditing(false);
  };
  if (isLoading) {
    return (
        <div className="text-white text-center p-8 animate-pulse">
            Cargando perfil...
        </div>
    );
  }
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-2xl text-white border border-gray-700 relative">
      {/* Botón de Logout (Posicionado arriba a la derecha) */}
      {!isEditing && (
        <button
            onClick={handleLogout}
            className="absolute top-6 right-6 text-red-400 hover:text-red-300 text-sm font-semibold flex items-center gap-2 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar Sesión
        </button>
      )}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8 mt-4"> {/* mt-4 para dar espacio al botón de logout */}
        {/* Foto de Perfil */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600 shadow-lg bg-gray-700">
            {formData.avatarUrl ? (
                <Image 
                src={formData.avatarUrl} 
                alt="Avatar" 
                width={128} 
                height={128} 
                className="object-cover w-full h-full"
                unoptimized 
                />
            ) : (
                <div className="w-full h-full bg-gray-600"></div>
            )}
          </div>
          {isEditing && ( 
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-xs text-gray-200 font-bold">Cambiar URL</span>
            </div>
          )}
        </div>
        {/* Info Usuario */}
        <div className="text-center md:text-left flex-1">
          <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
          <p className="text-gray-400">{user.email}</p>
          {!isEditing && (
             <span className="inline-block mt-2 px-3 py-1 bg-green-900 text-green-300 text-xs rounded-full border border-green-700">
               Coleccionista Activo
             </span>
          )}
        </div>
        {/* Botón Editar */}
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md"
          >
            Editar Perfil
          </button>
        )}
      </div>
      <div className="space-y-6">
        {/* Input Username */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de Usuario</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!isEditing}
            className={`
              w-full px-4 py-2 rounded-lg outline-none transition-all
              ${isEditing 
                ? 'bg-gray-700 border border-gray-600 focus:border-blue-500 text-white' 
                : 'bg-transparent border border-transparent text-gray-300 pl-0'
              }
            `}
          />
        </div>
        {/* Input Avatar (Solo en edición) */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">URL del Avatar</label>
            <input
              type="text"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 text-white outline-none"
              placeholder="https://..."
            />
          </div>
        )}
        {/* Input Email */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2 rounded-lg bg-transparent border border-transparent text-gray-500 pl-0 cursor-not-allowed"
          />
        </div>
      </div>
      {isEditing && (
        <div className="flex justify-end gap-4 mt-8 border-t border-gray-700 pt-6">
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="text-gray-300 hover:text-white px-4 py-2 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      )}
    </div>
  );
}