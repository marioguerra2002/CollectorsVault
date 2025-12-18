import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './app/lib/db/connectDB';
import authRoutes from './app/auth/authRoutes';
import { serieRouter } from './app/routers/serieRouter';
import { setRouter } from './app/routers/setRouter';
import { cardRouter } from './app/routers/cardRouter';
import { collectionRouter } from './app/routers/collectionRouter';
import { wishlistRouter } from './app/routers/wishlistRouter';
import { userRouter } from './app/routers/userRouter';
import { conversationRouter } from './app/routers/conversationRouter';
import executeTradeRouter from './app/routers/executeTradeRouter';
import type { ErrorRequestHandler } from 'express';
import type { IChatSocketMessage } from './app/interface/IChatSocketMessage';

/**
 * @desc Configuración de la aplicación Express y servidor HTTP con Socket.IO
 */
dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * @desc Middleware para parsear JSON, URL-encoded data y cookies.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * @desc Configuración de CORS para permitir solicitudes desde el cliente con cookies.
 */
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://collectorsvault.vercel.app', process.env.CLIENT_ORIGIN || 'http://localhost:3000' ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * @desc Rutas de la API
 */
app.use('/api/auth', authRoutes);
app.use('/api', collectionRouter);
app.use('/api', serieRouter);
app.use('/api', setRouter);
app.use('/api', cardRouter);
app.use('/api', wishlistRouter);
app.use('/api', userRouter);
app.use('/api', conversationRouter);
app.use('/api/execute-trade', executeTradeRouter);
app.get('/', (req, res) => {
  res.send('API del servidor de Pokémon TCG funcionando');
});

/**
 * @desc Manejador de errores
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
app.use(errorHandler);

/**
 * @desc Configuración del servidor HTTP y Socket.IO
 */
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://collectorsvault.vercel.app', process.env.CLIENT_ORIGIN || 'http://localhost:3000'],
    credentials: true,
  },
});

/**
 * @desc Manejo de conexiones Socket.IO
 */
export { io };
io.on('connection', (socket) => {
  socket.on('trade:join', ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user:joined', { userId: socket.id });
  });
  socket.on('user:subscribe', ({ userId }) => {
    socket.join(`user:${userId}`);
  });
  socket.on('trade:message', async (msg: IChatSocketMessage) => {
    if (msg.toUserId && msg.fromUserId && !msg.meta?.skipPersist) {
      try {
        // Reutilizamos las cookies de la sesión (incluye jwt) que llegan en el handshake del socket
        const cookieHeader = socket.handshake.headers.cookie || `userId=${msg.fromUserId}`;
        const response = await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/conversations/${msg.toUserId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
          },
          body: JSON.stringify({
            kind: msg.kind,
            payload: msg.payload
          })
        });
        if (response.ok) {
        } else {
          console.error('Error guardando mensaje en BD:', response.statusText);
        }
      } catch (error) {
        console.error('Error al guardar mensaje en BD:', error);
      }
    }
    io.to(msg.roomId).emit('trade:sync', msg);
    if (msg.toUserId) {
      io.to(`user:${msg.toUserId}`).emit('trade:sync', msg);
    }
  });
  socket.on('disconnect', () => {
  });
});

/** 
 * @desc Iniciar el servidor HTTP
 */
httpServer.listen(PORT, () => {
});
