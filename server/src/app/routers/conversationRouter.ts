import express from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/conversationModel';
import { authMiddleware } from '../middleware/authMiddleware';

/**
 * @desc Instancia de Socket.IO para prevenir dependencia circular en pruebas
 */
let io: any = null;

/**
 * @desc Función para obtener la instancia de Socket.IO
 * @returns la instancia de Socket.IO
 */
function getIO() {
  if (!io) {
    try {
      io = require('../../server').io;
    } catch (e) {
      io = { to: () => ({ emit: () => {} }) };
    }
  }
  return io;
}

/**
 * @desc Router para gestionar las conversaciones entre usuarios.
 */
export const conversationRouter = express.Router();


/**
 * Middleware para autenticar todas las rutas de este router
 */
conversationRouter.use(authMiddleware);

/**
 * @desc Obtener todas las conversaciones del usuario actual
 * @route GET /api/conversations
 * @access Public
 */
conversationRouter.get('/conversations', async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const conversations = await Conversation.find({
      $or: [{ user1: userId }, { user2: userId }]
    })
      .populate('user1', 'username email profileImageUrl')
      .populate('user2', 'username email profileImageUrl')
      .sort({ lastMessageAt: -1 });

    const formattedConversations = conversations.map(conv => {
      const otherUserId = conv.user1._id.toString() === userId.toString() ? conv.user2._id : conv.user1._id;
      const otherUser = conv.user1._id.toString() === userId.toString() ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[conv.messages.length - 1];
      return {
        _id: conv._id,
        otherUserId,
        otherUser,
        lastMessage: lastMessage || null,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessageAt: conv.lastMessageAt
      };
    });
    
    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ message: 'Error obteniendo conversaciones', error });
  }
});

/**
 * @desc Obtener una conversación específica con otro usuario
 * @route GET /api/conversations/:otherUserId
 * @access Public
 */
conversationRouter.get('/conversations/:otherUserId', async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    
    const conversation = await Conversation.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    })
      .populate('user1', 'username email profileImageUrl')
      .populate('user2', 'username email profileImageUrl');
    
      if (!conversation) {
      return res.status(200).json({
        _id: null,
        user1: userId,
        user2: otherUserId,
        messages: [],
        createdAt: null,
        lastMessageAt: null
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error obteniendo conversación:', error);
    res.status(500).json({ message: 'Error obteniendo conversación', error });
  }
});

/**
 * @desc Eliminar completamente una conversación con otro usuario
 * @route DELETE /api/conversations/:otherUserId
 * @access Public
 */
conversationRouter.delete('/conversations/:otherUserId', async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    
    const result = await Conversation.findOneAndDelete({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }
    
    const ioInstance = getIO();
    if (ioInstance) {
      ioInstance.to(`user:${otherUserId}`).emit('conversation:deleted', {
        deletedBy: userId,
        otherUserId: otherUserId,
        conversationId: result._id,
        message: 'La conversación ha sido eliminada por el otro usuario'
      });
    }
    
    res.status(200).json({ 
      message: 'Conversación eliminada exitosamente',
      deletedConversationId: result._id
    });
  } catch (error) {
    console.error('Error eliminando conversación:', error);
    res.status(500).json({ message: 'Error eliminando conversación', error });
  }
});

/**
 * @desc Verificar si existe una conversación entre el usuario actual y otro usuario
 * @route GET /api/conversations/verify/:otherUserId
 * @access Public
 */
conversationRouter.get('/conversations/verify/:otherUserId', async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const conversation = await Conversation.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    });
    
    res.status(200).json({
      exists: !!conversation,
      conversationId: conversation?._id || null,
      messageCount: conversation?.messages.length || 0,
      hasTradeProposal: !!conversation?.lastTradeProposal
    });
  } catch (error) {
    console.error('Error verificando conversación:', error);
    res.status(500).json({ message: 'Error verificando conversación', error });
  }
});

/**
 * @desc Guardar una propuesta de intercambio en la conversación
 * @route POST /api/conversations/:otherUserId/trade-proposal
 * @access Public
 */
conversationRouter.post('/conversations/:otherUserId/trade-proposal', async (req, res) => {
  try {
    
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    const { proposal } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    if (!proposal) {
      return res.status(400).json({ message: 'proposal es requerido' });
    }
    
    let conversation = await Conversation.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    });

    if (conversation?.isLocked) {
      return res.status(423).json({ message: 'La conversación está bloqueada y no acepta nuevas propuestas' });
    }
    if (!conversation) {
      const [user1, user2] = [userId, otherUserId].sort((a: any, b: any) => 
        a.toString().localeCompare(b.toString())
      );
      conversation = new Conversation({
        user1,
        user2,
        messages: [],
        lastTradeProposal: {
          proposer: userId,
          proposal,
          createdAt: new Date()
        }
      });
    } else {
      const proposerToUse = conversation.lastTradeProposal?.proposer || userId;
      conversation.lastTradeProposal = {
        proposer: proposerToUse,
        proposal,
        createdAt: conversation.lastTradeProposal?.createdAt || new Date()
      };
    }
    await conversation.save();
    res.status(201).json({
      message: 'Propuesta de intercambio guardada exitosamente',
      data: conversation.lastTradeProposal
    });
  } catch (error) {
    console.error('Error guardando propuesta de intercambio:', error);
    res.status(500).json({ message: 'Error guardando propuesta de intercambio', error });
  }
});

/**
 * @desc Obtener la última propuesta de intercambio en la conversación con otro usuario
 * @route GET /api/conversations/:otherUserId/trade-proposal
 * @access Public
 */
conversationRouter.get('/conversations/:otherUserId/trade-proposal', async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    
    const conversation = await Conversation.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    });
    
    if (!conversation || !conversation.lastTradeProposal) {
      return res.status(200).json({
        lastTradeProposal: null
      });
    }
    res.status(200).json({
      lastTradeProposal: conversation.lastTradeProposal
    });
  } catch (error) {
    console.error('Error obteniendo propuesta de intercambio:', error);
    res.status(500).json({ message: 'Error obteniendo propuesta de intercambio', error });
  }
});

/**
 * @desc Bloquea el chat y agrega un mensaje del sistema para informar a ambos usuarios.
 * @route PATCH /api/conversations/:otherUserId/lock
 * @access Public
 */
conversationRouter.patch('/conversations/:otherUserId/lock', async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    const { reason } = req.body as { reason?: 'accepted' | 'deleted' };
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    if (!reason || !['accepted', 'deleted'].includes(reason)) {
      return res.status(400).json({ message: 'reason debe ser accepted | deleted' });
    }
    
    let conversation = await Conversation.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    });
    
    if (!conversation) {
      const [user1, user2] = [userId, otherUserId].sort((a: any, b: any) =>
        a.toString().localeCompare(b.toString())
      );
      conversation = new Conversation({
        user1,
        user2,
        messages: [],
        isLocked: false
      });
    }

    if (conversation.isLocked && conversation.lockedReason === reason) {
      return res.status(200).json({
        message: 'La conversación ya estaba bloqueada',
        conversation,
      });
    }
    const systemText = reason === 'accepted'
      ? 'Propuesta aceptada, puede eliminar el chat'
      : 'Propuesta eliminada, puede eliminar el chat';
    const systemMessage = {
      fromUserId: userId,
      kind: 'system' as const,
      payload: { text: systemText, reason },
      createdAt: new Date()
    };
    conversation.isLocked = true;
    conversation.lockedReason = reason;
    conversation.lockedAt = new Date();
    conversation.messages.push(systemMessage);
    await conversation.save();
    return res.status(200).json({
      message: 'Conversación bloqueada correctamente',
      conversation,
      systemMessage
    });
  } catch (error) {
    console.error('Error bloqueando conversación:', error);
    res.status(500).json({ message: 'Error bloqueando conversación', error });
  }
});

/**
 * @desc Agregar un mensaje a una conversación (para persistencia)
 * @route POST /api/conversations/:otherUserId/messages
 * @access Public
 */
conversationRouter.post('/conversations/:otherUserId/messages', async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.params;
    const { kind, payload } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    if (!kind || !payload) {
      return res.status(400).json({ message: 'kind y payload son requeridos' });
    }

    let conversation = await Conversation.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId }
      ]
    });

    if (!conversation) {
      const [user1, user2] = [userId, otherUserId].sort((a: any, b: any) => 
        a.toString().localeCompare(b.toString())
      );
      conversation = new Conversation({
        user1,
        user2,
        messages: [{
          fromUserId: userId,
          kind,
          payload,
          createdAt: new Date()
        }]
      });
    } else {
      conversation.messages.push({
        fromUserId: userId,
        kind,
        payload,
        createdAt: new Date()
      });
    }
    await conversation.save();

    const addedMessage = conversation.messages[conversation.messages.length - 1];
    res.status(201).json({
      message: 'Mensaje agregado exitosamente',
      data: addedMessage
    });
  } catch (error) {
    console.error('Error agregando mensaje:', error);
    res.status(500).json({ message: 'Error agregando mensaje', error });
  }
});
