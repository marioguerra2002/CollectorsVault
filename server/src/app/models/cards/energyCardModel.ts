import { model, Schema } from "mongoose";
import type { IEnergyCard } from "../../interface/cards/IEnergyCard.js";
import { TypeConditionCard } from "../../enums/enumConditionCard.js";
/**
 * @desc Esquema de Mongoose para la entidad EnergyCard
 * 
 * @id Identificador único para la carta de Energía (rquerido).
 * @name Nombre de la carta de Energía.
 * @setName Nombre del set al que pertenece la carta de Energía.
 * @variants Objeto que contiene información de las variables de la carta de Energía.
 * @image URL de la imagen de la carta de Energía.
 * @updated Última actualización de la carta de Energía.
 * @rarity Rareza de la carta de Energía.
 * @condition Condición física de la carta de Energía.
 * @isTradable Condicional que indica si la carta de Energía esta disponible para intercambio.
 * @category Categoria de la carta de Energía (requerido).
 * @energyType Subtipo de energía elemental de la carta de Energía.
 * @energyTypePokemon Conjuto de tipos elementales de pokemon que puede tener la carta de Energía.
 * @effect Describe el efecto que tiene la carta de Energía.
 * @owner Propietarios de la carta de Energía.
 * @pricing Conjuto de datos relativos al precio de la carta de Energía.
 */
const energyCardSchema = new Schema<IEnergyCard>({
  id: { type: String, required: true },
  name: { type: String },
  setName: { type: String },
  variants: { type: Object },
  image: { type: String },
  updated: { type: String },
  rarity: { type: String },
  condition: { type: String, default: TypeConditionCard.MINT },
  isTradable: { type: Boolean },
  category: { type: String, required: true },
  energyType: { type: String },
  energyTypePokemon: { type: [String]},
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
 * @desc Modelo de Mongoose para la entidad EnergyCard
 */
export const EnergyCard = model<IEnergyCard>('EnergyCard', energyCardSchema);