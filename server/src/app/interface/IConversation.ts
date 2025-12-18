import { Document, Types } from 'mongoose';
/**
 * Interfaz para representar una conversación entre dos usuarios
 * que contiene el historial de mensajes persistente
 */
export interface IConversation extends Document {
  // IDs de los dos usuarios en la conversación (siempre ordenados para consistencia)
  user1: Types.ObjectId;
  user2: Types.ObjectId;
  // Historial de mensajes
  messages: Array<{
    _id?: Types.ObjectId;
    fromUserId: Types.ObjectId;
    kind: 'text' | 'proposal' | 'system';
    payload: any; // Puede ser ITextMessagePayload o IProposalMessagePayload
    createdAt: Date;
  }>;
  // Última propuesta de intercambio en esta conversación
  lastTradeProposal?: {
    proposer: Types.ObjectId; // Usuario que hizo la propuesta
    proposal: any; // La propuesta completa (IProposalMessagePayload)
    createdAt: Date;
  };
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date; // Para ordenar conversaciones por recientes
  // Estado de bloqueo del chat
  isLocked?: boolean;
  lockedReason?: 'accepted' | 'deleted' | null;
  lockedAt?: Date | null;
}
