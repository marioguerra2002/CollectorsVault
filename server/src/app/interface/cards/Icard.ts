import { Document } from "mongoose";
/**
 * Interfaz breve para representar una carta.
 * 
 * @idCard Identificador único de la carta.
 * @localIDCard Identificador local de la carta.
 * @name Nombre de la carta.
 * @image URL de la imagen de la carta.
 */
export interface ICardBrief extends Document {
  idCard: string;
  localIDCard: string;
  name: string;
  image: string;
}