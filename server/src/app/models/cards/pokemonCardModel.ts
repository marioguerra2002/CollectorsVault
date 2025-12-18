import { model, Schema } from 'mongoose';
import type { IPokemonCard } from '../../interface/cards/IPokemonCard.js';
import { TypeConditionCard } from '../../enums/enumConditionCard.js';
/**
 * @desc Esquema de Mongoose para la entidad PokemonCard
 * 
 * @id Identificador único para la carta de Pokémon (rquerido).
 * @name Nombre de la carta de Pokémon.
 * @image Imagen de la carta de Pokémon.
 * @category Categoria de la carta de Pokémon (rquerido).
 * @setName Nombre del set a la que pertenece la carta de Pokémon.
 * @rarity Rareza de la carta de Pokémon.
 * @variants Objeto que contiene información de las variables de la carta de Pokémon.
 * @updated Ultima actualización de la carta de Pokémon.
 * @condition Condición física de la carta de Pokémon.
 * @isTradable Condicional que indica si la carta de Pokémon esta disponible para intercambio.
 * @hp Puntos de salud del Pokémon de la carta de Pokémon.
 * @types Subtipo de Pokémon elemental de la carta de Pokémon.
 * @stage Etapa evolutiva del Pokémon de la carta de Pokémon.
 * @evolvesFrom Pokémon desde el cual evoluciona el Pokémon de la carta de Pokémon.
 * @description Descripción incluida en la carta de Pokémon.
 * @attacks Conjunto de ataques que tiene el Pokémon en la carta de Pokémon.
 * @weaknesses Debilidad que tiene el Pokémon en la carta de Pokémon.
 * @resistances Resistencia que tiene el Pokémon en la carta de Pokémon.
 * @retreatCost Coste de retirada que tiene el Pokémon en la carta de Pokémon.
 * @pricing Conjuto de datos relativos al precio de la carta de Pokémon.
 * @owner Propietarios la carta de Pokémon.
 */
const pokemonCardSchema = new Schema<IPokemonCard>({
  id: { type: String, required: true },
  name: { type: String },
  image: { type: String },
  category: { type: String, required: true },
  setName: { type: Object },
  rarity: { type: String },
  variants: { type: Object },
  updated: { type: String },
  condition: { type: String, default: TypeConditionCard.MINT },
  isTradable: { type: Boolean, default: false },
  hp: { type: Number },
  types: { type: [String] },
  stage: { type: String },
  evolvesFrom: { type: String },
  description: { type: String },
  attacks: [{
    cost: { type: [String] },
    name: { type: String },
    effect: { type: String },
    damage: { type: Number },
  }],
  weaknesses: [{
    type: { type: String },
    value: String
  }],
  resistances: [{
    type: { type: String },
    value: { type: String },
  }],
  retreatCost: { type: Number },
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
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true 
  }
});
/**
 * @desc Modelo de Mongoose para la entidad PokemonCard
 */
export const PokemonCard = model<IPokemonCard>('PokemonCard', pokemonCardSchema);