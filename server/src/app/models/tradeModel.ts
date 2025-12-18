import { model, Schema } from 'mongoose';
import type { ITrade } from '../interface/ITrade';
import { StatusTrade } from '../enums/enumStatusTrade';

/**
 * @desc Esquema de Mongoose para la entidad Trade
 * @id Identificador único del intercambio (requerido).
 * @user1 Referencia al primer usuario participante en el intercambio (requerido).
 * @user2 Referencia al segundo usuario participante en el intercambio (requerido).
 * @user1Items Array de objetos que representan los ítems ofrecidos por el primer usuario (requerido).
 * @user2Items Array de objetos que representan los ítems ofrecidos por el segundo usuario (requerido).
 * @status Estado actual del intercambio. Valores posibles: 'pending', 'accepted', 'declined', 'completed' (por defecto es 'pending').
 * @user1AproxValue Valor aproximado de los ítems ofrecidos por el primer usuario (por defecto es 0.00).
 * @user2AproxValue Valor aproximado de los ítems ofrecidos por el segundo usuario (por defecto es 0.00).
 */
const tradeSchema = new Schema<ITrade>({  
  id: { type: String, required: true },
  user1: { type: Schema.Types.ObjectId, ref: 'username', required: true },
  user2: { type: Schema.Types.ObjectId, ref: 'username', required: true },
  user1Items: [{ type: Object, required: true }],
  user2Items: [{ type: Object, required: true }],
  status: { type: String, default: StatusTrade.PENDING },
  user1AproxValue: { type: Number, default: 0.00 },
  user2AproxValue: { type: Number, default: 0.00 },
}, { timestamps: true });

/**
 * @desc Modelo de Mongoose para la entidad Trade
 */
export const Trade = model<ITrade>('Trade', tradeSchema);