import { Router } from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/conversationModel';
import { PokemonCard } from '../models/cards/pokemonCardModel';
import { TrainerCard } from '../models/cards/trainerCardModel';
import { EnergyCard } from '../models/cards/energyCardModel';
import { Trade } from '../models/tradeModel';
import { StatusTrade } from '../enums/enumStatusTrade';
import type { ICardBrief } from '../interface/cards/Icard';

/**
 * @desc Router para ejecutar un intercambio de cartas entre usuarios.
 */
const router = Router();

/**
 * @desc Helper function para obtener el modelo correcto
 * @param cardType Tipo de carta
 * @returns Modelo Mongoose correspondiente
 */
function getCardModel(cardType: string): any {
  switch (cardType) {
    case 'PokemonCard':
      return PokemonCard;
    case 'TrainerCard':
      return TrainerCard;
    case 'EnergyCard':
      return EnergyCard;
    default:
      throw new Error(`Tipo de carta inválido: ${cardType}`);
  }
}

/**
 * @desc Ejecutar un intercambio de cartas basado en la última propuesta en una conversación.
 * @route POST /api/execute-trade
 * @access Public
 */
router.post('/', async (req, res) => {
  const { conversationId } = req.body;
  
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId requerido' });
  }
  
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const conversation = await Conversation
      .findById(conversationId)
      .session(session);
    if (!conversation || !conversation.lastTradeProposal) {
      throw new Error('No existe propuesta de intercambio');
    }
    const proposal = conversation.lastTradeProposal.proposal;
    const { proposer, receiver } = proposal;

    if (!proposer.accepted || !receiver.accepted) {
      throw new Error('El intercambio no ha sido aceptado por ambas partes');
    }

    for (const side of [proposer, receiver]) {
      for (const card of side.cards) {
        const Model = getCardModel(card.cardType);
        const cardDoc = await Model.findById(card.cardId).session(session);
        if (!cardDoc) {
          console.error(`❌ Carta no encontrada con ID: ${card.cardId}`);
          throw new Error(`Carta no encontrada: ${card.cardId}`);
        }
        if (!cardDoc.isTradable) {
          throw new Error(`Carta no intercambiable: ${cardDoc.name}`);
        }
        if (!cardDoc.owner.equals(side.userId)) {
          throw new Error(`Owner incorrecto para carta: ${cardDoc.name}`);
        }
      }
    }

    const user1Items: ICardBrief[] = [];
    const user2Items: ICardBrief[] = [];
    
    for (const card of proposer.cards) {
      const Model = getCardModel(card.cardType);
      const cardDoc = await Model.findById(card.cardId).session(session);
      if (cardDoc) {
        user1Items.push({
          idCard: cardDoc.id,
          localIDCard: cardDoc._id.toString(),
          name: cardDoc.name || '',
          image: cardDoc.image || '',
        } as ICardBrief);
      }
    }
    
    for (const card of receiver.cards) {
      const Model = getCardModel(card.cardType);
      const cardDoc = await Model.findById(card.cardId).session(session);
      if (cardDoc) {
        user2Items.push({
          idCard: cardDoc.id,
          localIDCard: cardDoc._id.toString(),
          name: cardDoc.name || '',
          image: cardDoc.image || '',
        } as ICardBrief);
      }
    }

    const newTrade = new Trade({
      id: new mongoose.Types.ObjectId().toHexString(),
      user1: proposer.userId,
      user2: receiver.userId,
      user1Items,
      user2Items,
      user1AproxValue: 0,
      user2AproxValue: 0,
      status: StatusTrade.ACCEPTED,
    });
    await newTrade.save({ session });

    for (const card of proposer.cards) {
      const Model = getCardModel(card.cardType);
      await Model.updateOne(
        { _id: card.cardId },
        { owner: receiver.userId },
        { session }
      );
    }
    for (const card of receiver.cards) {
      const Model = getCardModel(card.cardType);
      await Model.updateOne(
        { _id: card.cardId },
        { owner: proposer.userId },
        { session }
      );
    }

    conversation.messages.push({
      fromUserId: proposer.userId,
      kind: 'system',
      payload: {
        text: 'Intercambio completado correctamente',
        reason: 'accepted',
        tradeId: newTrade.id,
      },
      createdAt: new Date(),
    } as any);

    conversation.isLocked = true;
    conversation.lockedReason = 'accepted';
    conversation.lockedAt = new Date();
    conversation.lastMessageAt = new Date();
    await conversation.save({ session });
    await session.commitTransaction();
    
    res.status(201).json({
      message: 'Intercambio realizado correctamente',
      tradeId: newTrade.id,
      trade: newTrade,
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

/**
 * @desc Exportar el router de ejecución de intercambios.
 */
export default router;
