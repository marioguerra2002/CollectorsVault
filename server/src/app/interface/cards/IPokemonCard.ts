import type { StagePokemon } from "../../enums/enumStagePokemon.js";
import type { TypeCard } from "../../enums/typeCard.js";
import type { TypeCardRarity } from "../../enums/typeCardRarity.js";
import type { TypeCurrency } from "../../enums/typeCurrency.js";
import type { TypePokemon } from "../../enums/typePokemon.js";
import type { ISetBrief } from "../ISets.js";
import type { IUser } from "../IUsers.js";
import type { Types } from "mongoose";
import { Document } from "mongoose";
import type { TypeConditionCard } from "../../enums/enumConditionCard.js";
/**
 * Interfaz principal para el documento de PokemonCard.
 * 
 * @id Identificador único de la carta de Pokémon.
 * @idSet Identificador del set al que pertenece la carta.
 * @idNumber Número identificador dentro del set.
 * @name Nombre de la carta de Pokémon.
 * @image URL de la imagen de la carta.
 * @rarity Rareza de la carta.
 * @ilustrator Nombre del ilustrador de la carta.
 * @setName Objeto que representa el set al que pertenece la carta.
 * @variants Objeto que indica las variantes disponibles de la carta.
 * @updated Fecha de la última actualización de la carta.
 * @condition Condición física de la carta.
 * @isTradable Indica si la carta es intercambiable.
 * @category Categoría de la carta (debe ser de tipo Pokémon).
 * @hp Puntos de salud del Pokémon.
 * @types Array de tipos del Pokémon.
 * @stage Etapa evolutiva del Pokémon.
 * @evolvesFrom (Opcional) Nombre del Pokémon del que evoluciona.
 * @description (Opcional) Descripción del Pokémon.
 * @attacks Array de objetos que representan los ataques del Pokémon.
 * @weaknesses Array de objetos que representan las debilidades del Pokémon.
 * @resistances Array de objetos que representan las resistencias del Pokémon.
 * @retreatCost Costo de retirada del Pokémon.
 * @pricing Objeto que contiene la información de precios en diferentes mercados.
 * @owner Usuario que posee la carta.
 */
export interface IPokemonCard extends Document {
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
  hp: number;
  types: TypePokemon[];
  stage: StagePokemon;
  evolvesFrom?: string;
  description?: string;
  attacks: {
    cost: TypePokemon[];
    name: string;
    effect: string;
    damage?: number;
  }
  weaknesses: {
    type: TypePokemon;
    value: string;
  }[];
  resistances: {
    type: TypePokemon;
    value: string;
  }[];
  retreatCost: number;
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
  owner: Types.ObjectId | IUser; 
}