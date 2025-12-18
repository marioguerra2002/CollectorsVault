import type { Document } from "mongoose";
import type { ICardBrief } from "./cards/Icard.js";
import type { ISeriesBrief } from "./ISeries.js";
/**
 * Interfaz principal para el documento de Set.
 * 
 * @cardCount Objeto que contiene el conteo de cartas en diferentes categorías.
 * @cards Array de objetos que representan las cartas incluidas en el set.
 * @id Identificador único del set.
 * @name Nombre del set.
 * @logo (Opcional) URL del logo del set.
 * @symbol Símbolo representativo del set.
 * @serie Objeto que representa la serie a la que pertenece el set.
 * @releaseDate Fecha de lanzamiento del set.
 * @legal Objeto que indica la legalidad del set en formatos estándar y expandido.
 */
export interface ISet extends Document {
  cardCount: {
    firstEdition: number;
    total: number;
    official: number;
    reverse: number;
    holo: number;
  };
  cards: Array<ICardBrief>;
  id: string;
  name: string;
  logo?: string;
  symbol: string;
  serie: ISeriesBrief;
  releaseDate: string;
  legal: {
    standard: boolean;
    expanded: boolean;
  }
}
/**
 * Interfaz breve para representar un set
 * 
 * @id Identificador único del set
 * @name Nombre del set
 * @logo URL del logo perteneciente al set
 * @symbol Símbolo representativo del set.
 * @cardCount Objeto que contiene el conteo de cartas en diferentes categorías.
 */
export interface ISetBrief extends Document {
  id: string;
  name: string;
  logo: string;
  symbol: string;
  cardCount: {
    total: number;
    official: number;
  };
}