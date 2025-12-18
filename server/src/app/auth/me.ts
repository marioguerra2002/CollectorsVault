import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
/**
 * @desc    Obtener datos del usuario actual
 * @route   GET /api/auth/me
 * @access  Private (Requiere estar logueado)
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user ya está relleno gracias al middleware 'protect' que usaremos en la ruta
  const user = req.user;
  if (user) {
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      // Si no tiene imagen, usamos una carta de Pokémon por defecto
      profileImageUrl: user.profileImageUrl || 'https://images.pokemontcg.io/base1/4.png',
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});