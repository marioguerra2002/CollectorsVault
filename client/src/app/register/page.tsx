
import RegisterForm from '@/app/components/RegisterForm'; // <-- 1. CAMBIO AQUÍ
// Estilos para centrar el contenido en la página (igual que en login)
const pageStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh', // Ocupa toda la altura
  width: '100%',
  backgroundColor: '#121212' // Fondo oscuro principal
};
export default function RegisterPage() {
  return (
    <div style={pageStyle}>
      {/* 2. CAMBIO AQUÍ */}
      <RegisterForm />
    </div>
  );
}