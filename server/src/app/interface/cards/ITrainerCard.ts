import type { TypeConditionCard } from "../../enums/enumConditionCard.js";
import type { TypeTrainer } from "../../enums/enumTypeTrainer.js";
import type { TypeCard } from "../../enums/typeCard.js";
import type { TypeCardRarity } from "../../enums/typeCardRarity.js";
import type { TypeCurrency } from "../../enums/typeCurrency.js";
import type { ISetBrief } from "../ISets.js";
import type { IUser } from "../IUsers.js";
import type { Types } from "mongoose";
import { Document } from "mongoose";
/**
 * Interfaz principal para el documento de TrainerCard.
 * 
 * @id Identificador único de la carta de entrenador.
 * @idSet Identificador del set al que pertenece la carta.
 * @idNumber Número identificador dentro del set.
 * @name Nombre de la carta de entrenador.
 * @image URL de la imagen de la carta.
 * @rarity Rareza de la carta.
 * @ilustrator Nombre del ilustrador de la carta.
 * @setName Objeto que representa el set al que pertenece la carta.
 * @variants Objeto que indica las variantes disponibles de la carta.
 * @updated Fecha de la última actualización de la carta.
 * @condition Condición física de la carta.
 * @isTradable Indica si la carta es intercambiable.
 * @category Categoría de la carta (debe ser de tipo entrenador).
 * @trainerType Tipo de entrenador representado por la carta.
 * @effect Descripción del efecto de la carta de entrenador.
 * @owner Usuario que posee la carta.
 * @pricing Objeto que contiene la información de precios en diferentes mercados.
 */
export interface ITrainerCard extends Document {
  id: string;
  idSet: string;
  idNumber: string;
  name: string;
  image: string;
  rarity: TypeCardRarity;
  ilustrator: string;
  setName: ISetBrief;
  variants: {
    firstedition: boolean;
    holo: boolean;
    reverse: boolean;
    normal: boolean;
    wPromo: boolean;
  }
  updated: String;
  condition: TypeConditionCard;
  isTradable: boolean;
  category: TypeCard;
  trainerType: TypeTrainer;
  effect: string;
  owner: Types.ObjectId | IUser; 
  pricing: {
    cardmarket: {
      updated: string;
      unit: TypeCurrency;
      avgPrice: number;
      avgHoloPrice: number;
    }
    tcgplayer: {
      updated: string;
      unit: TypeCurrency;
      normal: {
        marketPrice: number;
        avgHoloPrice: number;
      }
      reverse: {
        marketPrice: number;
        avgHoloPrice: number;
      }
    }
  }
}