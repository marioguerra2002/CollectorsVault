import { Schema, model } from 'mongoose';
import type { ITrainerCard } from '../../interface/cards/ITrainerCard.js';
import { TypeConditionCard } from '../../enums/enumConditionCard.js';
/**
 * @desc Esquema de Mongoose para la entidad TrainerCard
 * 
 * @category Categoria de la carta de Entrenador (requerido).
 * @id Identificador único para la carta de Entrenador (rquerido).
 * @idSet Identificador único del set al que pertenece la carta de Entrenador.
 * @idNumber Identificador único del numero de carta de Entrenador dentro del set.
 * @name Nombre de la carta de Entrenador.
 * @image Imagen de la carta de Entrenador.
 * @setName Nombre del set a la que pertenece la carta de Entrenador.
 * @rarity Rareza de la carta de Entrenador.
 * @variants Objeto que contiene información de las variables de la carta de Entrenador.
 * @updated Ultima actualización de la carta de Entrenador.
 * @condition Condición física de la carta de Entrenador.
 * @isTradable Condicional que indica si la carta de Entrenador esta disponible para intercambio.
 * @hp Puntos de salud del Entrenador de la carta de Entrenador.
 * @types Subtipo de Entrenador elemental de la carta de Entrenador.
 * @stage Etapa evolutiva del Entrenador de la carta de Entrenador.
 * @evolvesFrom Entrenador desde el cual evoluciona el Entrenador de la carta de Entrenador.
 * @description Descripción incluida en la carta de Entrenador.
 * @attacks Conjunto de ataques que tiene el Entrenador en la carta de Entrenador.
 * @weaknesses Debilidad que tiene el Entrenador en la carta de Entrenador.
 * @resistances Resistencia que tiene el Entrenador en la carta de Entrenador.
 * @retreatCost Coste de retirada que tiene el Entrenador en la carta de Entrenador.
 * @pricing Conjuto de datos relativos al precio de la carta de Entrenador.
 * @owner Propietarios la carta de Entrenador.
 */
const trainerCardSchema = new Schema<ITrainerCard>({
  category: { type: String, required: true },
  id: { type: String, required: true },
  idSet: { type: String },
  idNumber: { type: String },
  name: { type: String },
  image: { type: String },
  rarity: { type: String },
  setName: { type: Object },
  variants: { type: Object },
  updated: { type: String },
  condition: { type: String, default: TypeConditionCard.MINT },
  isTradable: { type: Boolean },
  trainerType: { type: String },
  effect: { type: String },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true 
  },
  pricing: {
    cardmarket: {
      updated: { type: String },
      unit: { type: String },
      avgPrice: { type: Number },
      avgHoloPrice: { type: Number },
    },
    tcgplayer: {
      updated: { type: String },
      unit: { type: String },
      normal: {
        marketPrice: { type: Number },
        avgHoloPrice: { type: Number },
      },
      reverse: {
        marketPrice: { type: Number },
        avgHoloPrice: { type: Number },
      },
    },
  }
})

/**
 * @desc Modelo de Mongoose para la entidad TrainerCard
 */
export const TrainerCard = model<ITrainerCard>('TrainerCard', trainerCardSchema);