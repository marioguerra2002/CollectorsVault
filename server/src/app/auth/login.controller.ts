import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import type { IUser } from '../interface/IUsers';
/**
 * Función helper para generar el token y setear la cookie
 */
const generateTokenAndSetCookie = (res: Response, userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido');
  }
  // Firmamos el token con el ID de usuario
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1d', // El token expira en 1 día
  });
  // Seteamos la cookie
  res.cookie('jwt', token, {
    httpOnly: true, // La cookie no es accesible por JavaScript en el cliente (seguridad XSS)
    secure: process.env.NODE_ENV !== 'development', // Usar 'secure' (HTTPS) solo en producción
    sameSite: 'strict', // Mitigación de ataques CSRF
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 día en milisegundos
  });
};
/**
 * @desc    Autentica un usuario y retorna un token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // 1. Validar que los campos lleguen
  if (!email || !password) {
    res.status(400);
    throw new Error('Por favor, complete todos los campos');
  }
  // 2. Buscar al usuario por email
  const user = await User.findOne<IUser>({ email });
  // 3. Validar usuario y contraseña
  if (user && (await user.comparePassword(password))) {
    // 4. Generar token y setear cookie
    generateTokenAndSetCookie(res, (user._id as any).toString());
    // 5. Enviar respuesta exitosa al cliente
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
    });
  } else {
    res.status(401);
    throw new Error('Email o contraseña inválidos');
  }
});