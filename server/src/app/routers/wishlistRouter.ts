import express from 'express';
import { protect } from '../middleware/authMiddleware';
import User from '../models/userModel';
import { tcgdex, dataclassToDict, mapRarityFromTCGdex } from '../utils/utils';

/**
 * @desc Router para gestionar la wishlist de cartas de los usuarios.
 */
export const wishlistRouter = express.Router();


/**
 * @desc Obtener mi wishlist (con detalles de cartas)
 * @route GET /wishlist
 * @access Private
 */
wishlistRouter.get('/wishlist', protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "No autorizado" });
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    
    const wishlistIds = user.wishlist || [];
    const cardPromises = wishlistIds.map(async (id) => {
      try {
        const cardData = await tcgdex.card.get(id);
        const cardDict = dataclassToDict(cardData);
        if (cardDict.rarity) {
          cardDict.rarity = mapRarityFromTCGdex(cardDict.rarity);
        }
        return cardDict;
      } catch (e) {
        return null;
      }
    });
    
    const cards = (await Promise.all(cardPromises)).filter(c => c !== null);
    res.status(200).json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo wishlist", error });
  }
});

/**
 * @desc Añadir una carta a la wishlist del usuario autenticado
 * @route POST /wishlist
 * @access Private
 */
wishlistRouter.post('/wishlist', protect, async (req, res) => {
  const { cardId } = req.body; 
  if (!req.user) return res.status(401).json({ message: "No autorizado" });
  if (!cardId) return res.status(400).json({ message: "Falta cardId" });
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (user.wishlist.includes(cardId)) {
      return res.status(200).json({ message: "Ya está en tu lista" });
    }
    user.wishlist.push(cardId);
    await user.save();
    res.status(200).json({ message: "Añadida a wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Error añadiendo a wishlist", error });
  }
});

/**
 * @desc Quitar una carta de la wishlist del usuario autenticado
 * @route DELETE /wishlist/:cardId
 * @access Private
 */
wishlistRouter.delete('/wishlist/:cardId', protect, async (req, res) => {
  const { cardId } = req.params;
  if (!req.user) return res.status(401).json({ message: "No autorizado" });
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    user.wishlist = user.wishlist.filter((id: string) => id !== cardId);  
    await user.save();
    res.status(200).json({ message: "Eliminada de wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando de wishlist", error });
  }
});