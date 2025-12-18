import express from 'express';
import { protect } from '../middleware/authMiddleware';
import User from '../models/userModel';

/**
 * @desc Router para gestionar los usuarios.
 */
export const userRouter = express.Router();

/**
 * @desc Buscar usuarios por nombre (coincidencia parcial)
 * @route GET /api/users/search?q=nombre
 * @access Private
 */
userRouter.get('/users/search', protect, async (req, res) => {
  const query = req.query.q?.toString();
  
  if (!query) {
    return res.status(400).json({ message: "Escribe algo para buscar" });
  }
  
  try {
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user?._id } 
    })
    .select('username profileImageUrl email')
    .limit(20);
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error buscando usuarios" });
  }
});

/**
 * @desc Obtener perfil público de un usuario por ID
 * @route GET /api/users/:userId
 * @access Private
 */
userRouter.get('/users/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profileImageUrl createdAt');
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo usuario" });
  }
});

/**
 * @desc Obtener URL de imagen de perfil de un usuario por ID
 * @route GET /api/users/:userId/profileImageUrl
 * @access Private
 */
userRouter.get('/users/:userId/profileImageUrl', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('profileImageUrl');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ profileImageUrl: user.profileImageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la imagen de perfil' });
  }
});