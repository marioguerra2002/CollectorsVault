import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
/**
 * @desc    Actualizar perfil de usuario (username, avatar)
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
  const { username, profileImageUrl } = req.body;
  // 1. Validar si el username ya existe (si es que lo está cambiando)
  if (username && username !== user.username) {
    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(400);
      throw new Error('Ese nombre de usuario ya está en uso');
    }
    user.username = username;
  }
  // 2. Actualizar avatar si se envía
  if (profileImageUrl !== undefined) {
    if (profileImageUrl === "") {
        // restaurar imagen por defecto si envían cadena vacía
        user.profileImageUrl = 'https://images.pokemontcg.io/base1/4.png';
    } else {
        // url valida
        try {
            new URL(profileImageUrl); 
            user.profileImageUrl = profileImageUrl;
        } catch (_) {
            res.status(400);
            throw new Error('La URL de la imagen no es válida');
        }
    }
  }
  // 3. Guardar cambios
  const updatedUser = await user.save();
  res.status(200).json({
    _id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    profileImageUrl: updatedUser.profileImageUrl,
    message: 'Perfil actualizado correctamente'
  });
});