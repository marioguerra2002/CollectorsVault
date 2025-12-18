import { model, Schema, Types } from 'mongoose';
import type { IConversation } from '../interface/IConversation';

/**
 * @desc Esquema de Mongoose para la entidad Conversation
 * 
 * @user1 Referencia al primer usuario participante en la conversación (requerido).
 * @user2 Referencia al segundo usuario participante en la conversación (requerido).
 * @messages Array de mensajes intercambiados en la conversación.
 *   @fromUserId Referencia al usuario que envió el mensaje (requerido).
 *   @kind Tipo de mensaje: 'text', 'proposal' o 'system' (requerido).
 *   @payload Contenido del mensaje (requerido).
 *   @createdAt Fecha y hora en que se creó el mensaje.
 * @isLocked Indica si la conversación está bloqueada.
 * @lockedReason Razón por la cual la conversación está bloqueada: 'accepted' o 'deleted'.
 * @lockedAt Fecha y hora en que se bloqueó la conversación.
 * @lastTradeProposal Información sobre la última propuesta de intercambio realizada en la conversación.
 *   @proposer Referencia al usuario que realizó la propuesta.
 *   @proposal Contenido de la propuesta de intercambio.
 *   @createdAt Fecha y hora en que se creó la propuesta.
 * @lastMessageAt Fecha y hora del último mensaje en la conversación.
 */
const conversationSchema = new Schema<IConversation>(
  {
    user1: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    user2: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    messages: [
      {
        fromUserId: { 
          type: Schema.Types.ObjectId, 
          ref: 'User',
          required: true 
        },
        kind: { 
          type: String, 
          enum: ['text', 'proposal', 'system'],
          required: true 
        },
        payload: {
          type: Schema.Types.Mixed,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isLocked: {
      type: Boolean,
      default: false
    },
    lockedReason: {
      type: String,
      enum: ['accepted', 'deleted'],
      default: undefined
    },
    lockedAt: {
      type: Date,
      default: null
    },
    lastTradeProposal: {
      proposer: { 
        type: Schema.Types.ObjectId, 
        ref: 'User'
      },
      proposal: {
        type: Schema.Types.Mixed
      },
      createdAt: {
        type: Date
      }
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true
  }
);

/**
 * @desc Índices y middleware para la entidad Conversation
 */
conversationSchema.index({ user1: 1, user2: 1 });
conversationSchema.index({ lastMessageAt: -1 });

/**
 * @desc Middleware para actualizar el campo lastMessageAt antes de guardar un documento Conversation
 */
conversationSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.messages && doc.messages.length > 0) {
    const lastMsg = doc.messages[doc.messages.length - 1];
    doc.lastMessageAt = lastMsg.createdAt || new Date();
  }
  next();
});

/**
 * @desc Modelo de Mongoose para la entidad Conversation
 */
export const Conversation = model<IConversation>('Conversation', conversationSchema);
