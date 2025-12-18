import {Document} from 'mongoose';
import type { StatusTrade } from '../enums/enumStatusTrade';
import type { IUser } from './IUsers';
import type { ICardBrief } from './cards/Icard';
/**
 * Interfaz principal para el documento de Intercambio.
 * 
 * @user1 Referencia al primer usuario participante en el intercambio.
 * @user2 Referencia al segundo usuario participante en el intercambio.
 * @user1Items Array de objetos que representan los ítems ofrecidos por el primer usuario.
 * @user2Items Array de objetos que representan los ítems ofrecidos por el segundo usuario.
 * @user1AproxValue Valor aproximado de los ítems ofrecidos por el primer usuario.
 * @user2AproxValue Valor aproximado de los ítems ofrecidos por el segundo usuario.
 * @status Estado actual del intercambio (PENDING, ACCEPTED, REJECTED).
 * @createdAt Fecha de creación del intercambio.
 * @updatedAt Fecha de la última actualización del intercambio.
 */
export interface ITrade extends Document {
  id: string;
  user1: IUser;
  user2: IUser;
  user1Items: Array<ICardBrief>;
  user2Items: Array<ICardBrief>;
  user1AproxValue?: number;
  user2AproxValue?: number;
  status: StatusTrade;
  createdAt: Date;
  updatedAt: Date;
}