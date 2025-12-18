import express from "express";
import mongoose from 'mongoose';
import { protect } from "../middleware/authMiddleware";
import { TypeCard } from "../enums/typeCard";
import { PokemonCard } from "../models/cards/pokemonCardModel.js";
import { TrainerCard } from "../models/cards/trainerCardModel.js";
import { EnergyCard } from "../models/cards/energyCardModel.js";
import { tcgdex, dataclassToDict, mapRarityFromTCGdex } from "../utils/utils.js";

/**
 * @desc Router para gestión de cartas (crear, leer, actualizar, eliminar)
 */
export const cardRouter = express.Router();

/**
 * @desc Limpia y convierte el valor de daño de un ataque a número.
 *       Si no es posible, devuelve 0.
 * @param damage Valor original del daño (string o número)
 * @returns Daño como número
 */
const cleanDamageValue = (damage: any): number => {
  if (typeof damage === 'number') return damage;
  if (typeof damage !== 'string') return 0;
  const cleaned = damage.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};

/**
 * @desc Crear una nueva carta en la base de datos y asignarla al usuario logueado.
 * @route POST /cards
 * @access Private (Requiere Auth)
 */
cardRouter.post("/cards", protect, async (req, res) => {
  const { id: id_, category, condition, isTradable } = req.body; 
  
  if (!req.user) {
    return res.status(401).json({ message: "Usuario no autorizado" });
  }
  
  if (!id_) {
    return res.status(400).json({ message: "ID is required" });
  }
  
  try {
    const apiResponse = await tcgdex.card.get(id_);
    const cardDict = dataclassToDict(apiResponse);
    
    let imageUrl = cardDict.image;
    if (!imageUrl && cardDict.set && cardDict.localId) {
      imageUrl = `https://assets.tcgdex.net/en/${cardDict.set.id}/${cardDict.localId}`;
    }
    
    let cleanedAttacks = [];
    if (Array.isArray(cardDict.attacks)) {
      cleanedAttacks = cardDict.attacks.map((attack: any) => ({
        ...attack,
        damage: cleanDamageValue(attack.damage) 
      }));
    }
    
    const mappedRarity = mapRarityFromTCGdex(cardDict.rarity);
    const cardDataRaw = {
      ...cardDict,
      image: imageUrl,
      owner: req.user._id, 
      isTradable: isTradable,
      condition: condition,
      rarity: mappedRarity, 
      attacks: cleanedAttacks 
    };
    
    const categoryToUse = (category && category.trim()) ? category : (cardDict?.category || '');
    const lc = categoryToUse.toLowerCase();
    
    let resolvedCategory: string = TypeCard.POKEMON; 
    if (lc.includes('train') || lc.includes('trainer') || lc.includes('entren')) {
      resolvedCategory = TypeCard.TRAINER;
    } else if (lc.includes('ener') || lc.includes('energy') || lc.includes('energ')) {
      resolvedCategory = TypeCard.ENERGY;
    } else if (lc.includes('pok') || lc.includes('pokemon') || lc.includes('pokémon')) {
      resolvedCategory = TypeCard.POKEMON;
    }

    if (resolvedCategory === TypeCard.TRAINER) {
      const newTrainer = new TrainerCard(cardDataRaw);
      await newTrainer.save();
      res.status(201).json({ message: "Trainer Card created successfully", newTrainer });
    } else if (resolvedCategory === TypeCard.POKEMON) {
      const newPokemon = new PokemonCard(cardDataRaw);
      await newPokemon.save();
      res.status(201).json({ message: "Pokemon Card created successfully", newPokemon });
    } else if (resolvedCategory === TypeCard.ENERGY) {
      const newEnergy = new EnergyCard(cardDataRaw);
      await newEnergy.save();
      res.status(201).json({ message: "Energy Card created successfully", newEnergy });
    } else {
      return res.status(400).json({ message: "Invalid category" });
    }
  } catch (error: any) {
    console.error('Error in POST /cards:', error);
    res.status(500).json({ message: "Error creating card", error });
  }
}); 

/**
 * @desc Obtener la colección de cartas de un usuario (propia o ajena).
 * @route GET /collection?userId=xxxxx
 * @access Private
 */
cardRouter.get("/collection", protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  
  try {
    const targetOwnerId = req.query.userId || req.user._id;
    const [pokemonCards, trainerCards, energyCards] = await Promise.all([
      PokemonCard.find({ owner: targetOwnerId }),
      TrainerCard.find({ owner: targetOwnerId }),
      EnergyCard.find({ owner: targetOwnerId })
    ]);

    const allCards = [...pokemonCards, ...trainerCards, ...energyCards];
    res.status(200).json(allCards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching collection", error });
  }
});

/**
 * @desc Obtener la colección de cartas de un usuario específico por su userId.
 * @route GET /collection/:userId
 * @access Private
 */
cardRouter.get("/collection/:userId", protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  
  try {
    const targetOwnerId = req.params.userId;
    const [pokemonCards, trainerCards, energyCards] = await Promise.all([
      PokemonCard.find({ owner: targetOwnerId }),
      TrainerCard.find({ owner: targetOwnerId }),
      EnergyCard.find({ owner: targetOwnerId })
    ]);
    const allCards = [...pokemonCards, ...trainerCards, ...energyCards];
    res.status(200).json(allCards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching collection", error });
  }
});

/**
 * @desc Buscar usuarios que tienen una carta específica para intercambiar.
 * @route GET /cards/traders/:cardApiId
 * @access Private
 */
cardRouter.get("/cards/traders/:cardApiId", protect, async (req, res) => {
  const { cardApiId } = req.params;
  
  try {
    const filter = { 
      id: cardApiId, 
      isTradable: true,
      owner: { $ne: req.user?._id } 
    };
    
    const userFields = 'username profileImageUrl email';
    const [pokemon, trainers, energy] = await Promise.all([
      PokemonCard.find(filter).populate('owner', userFields),
      TrainerCard.find(filter).populate('owner', userFields),
      EnergyCard.find(filter).populate('owner', userFields)
    ]);

    const traders = [...pokemon, ...trainers, ...energy].map((card: any) => ({
      cardId: card._id,        
      condition: card.condition,
      owner: card.owner        
    }));

    res.status(200).json(traders);
  } catch (error) {
    res.status(500).json({ message: "Error finding traders", error });
  }
});

/**
 * @desc Buscar cartas por nombre y obtener a los dueños
 * @route GET /cards/search-owners?name=...
 * @access Private
 */
cardRouter.get("/cards/search-owners", protect, async (req, res) => {
  const name = req.query.name?.toString() || '';
  if(!name) {
    return res.status(400).json({ message: "Name query parameter is required" });
  }
  try {
    const regex = new RegExp(name, 'i');
    const filter = { name: regex }; 
    const userFields = 'username profileImageUrl email';
    const [pokemon, trainers, energy] = await Promise.all([
      PokemonCard.find(filter).populate('owner', userFields),
      TrainerCard.find(filter).populate('owner', userFields),
      EnergyCard.find(filter).populate('owner', userFields)
    ]);
    const results = [...pokemon, ...trainers, ...energy].map((card: any) => ({
      cardId: card._id,
      tcgdexId: card.id,
      name: card.name,
      category: card.category,
      image: card.image,
      condition: card.condition,
      rarity: card.rarity,
      isTradable: card.isTradable,
      owner: card.owner
    }));
    const validResults = results.filter(card => card.owner && typeof card.owner === 'object');
    res.status(200).json(validResults);
  } catch (error) {
    res.status(500).json({ message: "Error searching cards", error });
  }
});

/**
 * @desc Obtener detalles de una carta específica por su _id de MongoDB
 * @route GET /cards/:id
 * @access Private
 */
cardRouter.get("/cards/:id", protect, async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid card ID format" });
    }
    
    const cardId = new mongoose.Types.ObjectId(id);
    const [pokemonCard, trainerCard, energyCard] = await Promise.all([
      PokemonCard.findById(cardId).lean(),
      TrainerCard.findById(cardId).lean(),
      EnergyCard.findById(cardId).lean()
    ]);
    
    const card = pokemonCard || trainerCard || energyCard;
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.status(200).json({
      ...card,
      tcgdexId: card.id,
    });

  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ message: "Error fetching card details", error });
  }
});
/**
 * @desc Eliminar una carta (asegurando que pertenece al usuario).
 * @route DELETE /cards/:id
 * @access Private
 */
cardRouter.delete("/cards/:id", protect, async (req, res) => {
  
  const id = req.params.id;
  const category = req.body.category;
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  
  try {
    const idParam = String(id);
    const isObjectId = mongoose.Types.ObjectId.isValid(idParam);
    const baseFilter: any = isObjectId 
      ? { _id: new mongoose.Types.ObjectId(idParam), owner: req.user._id } 
      : { id: idParam, owner: req.user._id };
    let deletedCard;
    
    const rawCat = (category || '').toString().toLowerCase();

    if (!rawCat) {
      deletedCard = await PokemonCard.findOneAndDelete(baseFilter);
      if (!deletedCard) {
        deletedCard = await TrainerCard.findOneAndDelete(baseFilter);
      }
      if (!deletedCard) {
        deletedCard = await EnergyCard.findOneAndDelete(baseFilter);
      }
    } else {
      let resolvedCat = TypeCard.POKEMON;
      
      if (rawCat.includes('train') || rawCat.includes('trainer') || rawCat.includes('entren')) resolvedCat = TypeCard.TRAINER;
      else if (rawCat.includes('ener') || rawCat.includes('energy') || rawCat.includes('energ')) resolvedCat = TypeCard.ENERGY;
      else if (rawCat.includes('pok') || rawCat.includes('pokemon') || rawCat.includes('pokémon')) resolvedCat = TypeCard.POKEMON;
      
      if (resolvedCat === TypeCard.POKEMON) {
        deletedCard = await PokemonCard.findOneAndDelete(baseFilter);
      }
      else if (resolvedCat === TypeCard.TRAINER) {
        deletedCard = await TrainerCard.findOneAndDelete(baseFilter);
      }
      else if (resolvedCat === TypeCard.ENERGY) {
        deletedCard = await EnergyCard.findOneAndDelete(baseFilter);
      }
    }
    
    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found or you don't own it" });
    }

    return res.status(200).json({ message: "Card deleted successfully", deletedCard });
  } catch (error) {
    res.status(500).json({ message: "Error deleting card", error });
  }
});

/**
 * @desc Update the isTradable status of a card.
 * @route PATCH /cards/:id/tradable
 * @access Private
 */
cardRouter.patch("/cards/:id/tradable", protect, async (req, res) => {
  const { id } = req.params;
  const { isTradable } = req.body;
  
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (typeof isTradable !== "boolean") {
    return res.status(400).json({ message: "isTradable must be a boolean" });
  }
  
  try {
    const idParam = String(id);
    const isObjectId = mongoose.Types.ObjectId.isValid(idParam);
    const filter = isObjectId ? { _id: idParam, owner: req.user._id } : { id: idParam, owner: req.user._id };
    
    let updatedCard = await PokemonCard.findOneAndUpdate(filter, { isTradable }, { new: true });
    if (!updatedCard) updatedCard = await TrainerCard.findOneAndUpdate(filter, { isTradable }, { new: true });
    if (!updatedCard) updatedCard = await EnergyCard.findOneAndUpdate(filter, { isTradable }, { new: true });
    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found or you don't own it" });
    }
    
    return res.status(200).json({ message: "Card tradable status updated", updatedCard });
  } catch (error) {
    res.status(500).json({ message: "Error updating card", error });
  }
});
