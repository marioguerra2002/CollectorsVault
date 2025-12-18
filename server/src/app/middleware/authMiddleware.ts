import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel'; 
import type { IUser } from '../interface/IUsers';
// extendemos para incluir la propiedad 'user'
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
/**
 * @desc    Middleware para proteger rutas
 * Verifica el JWT de la cookie y adjunta el usuario a req.user
 */
export const authMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  // 1. Leer el token de la cookie 'jwt'
  token = req.cookies.jwt;
  if (token) {
    try {
      if (!process.env.JWT_SECRET) {
        res.status(401).json({ message: 'JWT_SECRET no está definido' });
        return;
      }
      // 2. Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      // 3. Obtener el usuario de la BD usando el ID del token
      // Usamos .select('-password') para excluir el hash de la contraseña
      req.user = await User.findById(decoded.userId).select('-password');
      if (!req.user) {
        res.status(401).json({ message: 'Usuario no encontrado' });
        return;
      }
      // 4. Llamar al siguiente middleware
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Token inválido o expirado' });
    }
  } else {
    res.status(401).json({ message: 'No hay token de autenticación' });
  }
});
// Alias para compatibilidad
export const protect = authMiddleware;