// // import LoginForm from '@/app/components/LoginForm';
// // /*
// //  * Este CSS aplica el fondo negro a toda la página de login
// //  * y centra el formulario. Es un estilo 'inline' simple 
// //  * porque solo necesitamos centrar el contenido.
// // */
// // const pageStyle: React.CSSProperties = {
// //   display: 'flex',
// //   justifyContent: 'center',
// //   alignItems: 'center',
// //   minHeight: '100vh', // Ocupa toda la altura de la pantalla
// //   width: '100vw',     // Ocupa todo el ancho
// //   backgroundColor: '#1e1f22' // Fondo negro/gris oscuro
// // };
// // export default function LoginPage() {
// //   return (
// //     // Aplicamos los estilos de centrado a la página
// //     <div style={pageStyle}>
// //       {/* Renderizamos el formulario que ahora tiene su propio diseño */}
// //       <LoginForm />
// //     </div>
// //   );
// // }
// import LoginForm from '@/app/components/LoginForm';
// /*
//  * Este CSS aplica el fondo negro a toda la página de login
//  * y centra el formulario. Es un estilo 'inline' simple 
//  * porque solo necesitamos centrar el contenido.
// */
// const pageStyle: React.CSSProperties = {
//   display: 'flex',
//   justifyContent: 'center',
//   alignItems: 'center',
//   minHeight: '100vh', // Ocupa toda la altura de la pantalla
//   width: '100vw',     // Ocupa todo el ancho
//   backgroundColor: '#1e1f22' // Fondo negro/gris oscuro
// };
// export default function LoginPage() {
//   return (
//     // Aplicamos los estilos de centrado a la página
//     <div style={pageStyle}>
//       {/* Renderizamos el formulario que ahora tiene su propio diseño */}
//       <LoginForm />
//     </div>
//   );
// }
import LoginForm from '@/app/components/LoginForm';
// Estilos para centrar el contenido en la página
const pageStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh', // Ocupa toda la altura
  width: '100%',
  backgroundColor: '#121212' // Fondo oscuro principal
};
export default function LoginPage() {
  return (
    <div style={pageStyle}>
      {/* Renderizamos el formulario */}
      <LoginForm />
    </div>
  );
}