import express from 'express';
import mongoose from 'mongoose';
import User from '../models/userModel';
import { PokemonCard } from '../models/cards/pokemonCardModel';
import { TrainerCard } from '../models/cards/trainerCardModel';
import { EnergyCard } from '../models/cards/energyCardModel';
import { protect } from '../middleware/authMiddleware';

/**
 * @desc Router para gestionar la colección de cartas de los usuarios.
 */
export const collectionRouter = express.Router();

/**
 * @desc Obtener las cartas de la colección del usuario autenticado
 * @route GET /api/collection
 * @access Private
 */
collectionRouter.get('/collection', protect, async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const targetUserIdString = (req.query.userId as string) || userId.toString();
    const targetUserId = new mongoose.Types.ObjectId(targetUserIdString);
    const [pokemonCards, trainerCards, energyCards] = await Promise.all([
      PokemonCard.find({ owner: targetUserId }).lean(),
      TrainerCard.find({ owner: targetUserId }).lean(),
      EnergyCard.find({ owner: targetUserId }).lean()
    ]);
    
    const cards = [...pokemonCards, ...trainerCards, ...energyCards];
    const cardsWithStringId = cards.map(card => ({
      ...card,
      _id: String(card._id)
    }));

    return res.status(200).json(cardsWithStringId);
  } catch (error) {
    console.error('Error en GET /collection:', error);
    return res.status(500).json({ message: 'Error al obtener la colección', error });
  }
});

/**
 * @desc Filtrar las cartas de la colección del usuario autenticado
 * @route GET /api/collection/filter
 * @access Private
 */
collectionRouter.get('/collection/filter', protect, async (req, res) => {
  try {
    const authenticatedUserId = req.user?._id;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const { rarity, condition, cardType, userId, isTradable } = req.query;
    const targetUserId = userId ? new mongoose.Types.ObjectId(userId as string) : authenticatedUserId;

    const baseFilters: any = {
      owner: targetUserId
    };

    if (rarity) baseFilters.rarity = { $in: (rarity as string).split(',') };
    if (condition) baseFilters.condition = { $in: (condition as string).split(',') };
    if (typeof isTradable !== 'undefined') baseFilters.isTradable = isTradable === 'true';
    
    let pokemonCards: any[] = [];
    let trainerCards: any[] = [];
    let energyCards: any[] = [];
    
    if (cardType) {
      const types = (cardType as string).split(',');
      if (types.includes('Pokemon')) {
        pokemonCards = await PokemonCard.find(baseFilters);
      }
      if (types.includes('Trainer')) {
        trainerCards = await TrainerCard.find(baseFilters);
      }
      if (types.includes('Energy')) {
        energyCards = await EnergyCard.find(baseFilters);
      }
    } else {
      [pokemonCards, trainerCards, energyCards] = await Promise.all([
        PokemonCard.find(baseFilters),
        TrainerCard.find(baseFilters),
        EnergyCard.find(baseFilters)
      ]);
    }
    
    const cards = [...pokemonCards, ...trainerCards, ...energyCards];
    const cardsWithStringId = cards.map(card => ({
      ...card.toObject ? card.toObject() : card,
      _id: String(card._id)
    }));
    
    return res.status(200).json(cardsWithStringId);
  } catch (error) {
    console.error('Error al filtrar la colección:', error);
    return res.status(500).json({ message: 'Error al filtrar las cartas', error });
  }
});

/**
 * @desc Añadir una carta a la colección del usuario autenticado
 * @route POST /api/collection/add
 * @access Private
 */
collectionRouter.post('/collection/add', protect, async (req, res) => {
  try {
    
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });
    const { cardId } = req.body;
    if (!cardId) return res.status(400).json({ message: 'cardId es requerido' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    
    const normalized = mongoose.Types.ObjectId.isValid(cardId) ? new mongoose.Types.ObjectId(cardId) : cardId;
    const exists = user.cardCollection.some((c: any) => c.toString() === normalized.toString());
    
    if (exists) return res.status(200).json({ message: 'Carta ya en la colección' });
    
    user.cardCollection.push(normalized as any);
    await user.save();
    return res.status(200).json({ message: 'Carta añadida', cardId: normalized });
  } catch (error) {
    return res.status(500).json({ message: 'Error al añadir carta', error });
  }
});

/**
 * @desc Eliminar una carta de la colección del usuario autenticado
 * @route DELETE /api/collection/:cardId
 * @access Private
 */
collectionRouter.delete('/collection/:cardId', protect, async (req, res) => {
  try {
    
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });
    const { cardId } = req.params;
    if (!cardId) return res.status(400).json({ message: 'cardId es requerido' });
    
    const normalized = mongoose.Types.ObjectId.isValid(cardId) ? new mongoose.Types.ObjectId(cardId) : cardId;
    const update = await User.findByIdAndUpdate(userId, { $pull: { cardCollection: normalized } }, { new: true });
    if (!update) return res.status(404).json({ message: 'Usuario no encontrado' });
    
    return res.status(200).json({ message: 'Carta eliminada', cardId: normalized });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar carta', error });
  }
});
