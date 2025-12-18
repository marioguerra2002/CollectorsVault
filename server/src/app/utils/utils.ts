import TCGdex from '@tcgdex/sdk';
import { ILanguage } from '../enums/enumLanguageAPI.js';
import { TypeCardRarity } from '../enums/typeCardRarity.js';

/**
 * @desc Instancia del SDK de TCGdex para interactuar con la API de TCGdex.
 */
export const tcgdex = new TCGdex(`${ILanguage.EN}`); 

/**
 * @desc URL base de la API de TCGdex.
 */
export const API_URL = `https://api.tcgdex.net/v2/${ILanguage.EN}`

/**
 * @desc Convierte una instancia de dataclass del SDK de TCGdex a un diccionario JSON.
*/
export function dataclassToDict(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(dataclassToDict);
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "sdk") continue;
    result[key] = dataclassToDict(value);
  }
  return result;
}

/**
 * @desc Mapea las rarezas de TCGdex al formato del enum TypeCardRarity.
 * @param tcgdexRarity - La rareza devuelta por la API de TCGdex
 * @returns La rareza mapeada al formato del enum TypeCardRarity
 */
export function mapRarityFromTCGdex(tcgdexRarity: string | undefined): string {
  if (!tcgdexRarity) return TypeCardRarity.COMMON;
  const normalized = tcgdexRarity.toLowerCase().trim();
  const rarityMap: { [key: string]: string } = {
    'common': TypeCardRarity.COMMON,
    'uncommon': TypeCardRarity.UNCOMMON,
    'rare': TypeCardRarity.RARE,
    'ultra rare': TypeCardRarity.RARE_ULTRA,
    'rare ultra': TypeCardRarity.RARE_ULTRA,
    'hyper rare': TypeCardRarity.RARE_HIPER,
    'rare hiper': TypeCardRarity.RARE_HIPER,
    'rare hyper': TypeCardRarity.RARE_HIPER,
    'secret rare': TypeCardRarity.RARE_HIPER,
    'rare secret': TypeCardRarity.RARE_HIPER,
    'rare rainbow': TypeCardRarity.RARE_HIPER,
    'illustration rare': TypeCardRarity.RARE_ILUSTRATION,
    'rare illustration': TypeCardRarity.RARE_ILUSTRATION,
    'special illustration rare': TypeCardRarity.RARE_SPECIAL_ILUSTRATION,
    'rare special illustration': TypeCardRarity.RARE_SPECIAL_ILUSTRATION,
    'double rare': TypeCardRarity.RARE_DOUBLE,
    'rare double': TypeCardRarity.RARE_DOUBLE,
    'reverse holo': TypeCardRarity.REVERSE_HOLO,
    'holo rare': TypeCardRarity.RARE,
    'rare holo': TypeCardRarity.RARE,
    'rare holo v': TypeCardRarity.RARE_ULTRA,
    'rare holo vmax': TypeCardRarity.RARE_ULTRA,
    'rare holo vstar': TypeCardRarity.RARE_ULTRA,
    'rare shiny': TypeCardRarity.RARE_ULTRA,
    'holo rare v': TypeCardRarity.RARE_ULTRA,
    'holo rare vmax': TypeCardRarity.RARE_ULTRA,
    'holo rare vstar': TypeCardRarity.RARE_ULTRA,
    'four diamond': TypeCardRarity.RARE_HIPER,
    'three diamond': TypeCardRarity.RARE_ULTRA,
    'two diamond': TypeCardRarity.RARE_DOUBLE,
    'one diamond': TypeCardRarity.RARE,
    'two star': TypeCardRarity.RARE_ULTRA,
    'one star': TypeCardRarity.RARE,
    'promo': TypeCardRarity.PROMO,
    'none': TypeCardRarity.COMMON,
    'unknown': TypeCardRarity.COMMON,
  };

  if (rarityMap[normalized]) {
    return rarityMap[normalized];
  }

  return tcgdexRarity;
}