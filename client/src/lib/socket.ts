// client/src/lib/socket.ts
import { io } from 'socket.io-client';

// URL de tu Backend
const URL = 'https://collectorsvault.onrender.com';

// Creamos la instancia UNA SOLA VEZ fuera de los componentes
export const socket = io(URL, {
  autoConnect: false, // Importante: No se conecta solo, nosotros le diremos cuándo
  withCredentials: true,
  transports: ['polling', 'websocket'],
});