import { model, Schema } from 'mongoose';
import type { ISet } from '../interface/ISets.js';

/**
 * @desc Esquema de Mongoose para la entidad Set
 * @cardCount Objeto que contiene el conteo de cartas del set.
 * @cards Conjunto de cartas que pertenecen al set.
 * @id Identificador único del set (requerido).
 * @name Nombre del set.
 * @logo URL del logo del set.
 * @symbol URL del símbolo del set.
 * @serie Objeto que contiene información de la serie a la que pertenece el set.
 * @releaseDate Fecha de lanzamiento del set.
 * @legal Objeto que indica la legalidad del set en los formatos estándar y expandido.
 */
const setSchema = new Schema<ISet>({
  cardCount: {
    firstEdition: { type: Number },
    total: { type: Number },
    official: { type: Number },
    reverse: { type: Number },
    holo: { type: Number},
  },
  cards: { type: [Object] },
  id: { type: String, required: true },
  name: { type: String },
  logo: { type: String },
  symbol: { type: String },
  serie: { type: Object },
  releaseDate: { type: String },
  legal: {
    standard: { type: Boolean },
    expanded: { type: Boolean },
  },
});

/**
 * @desc Modelo de Mongoose para la entidad Set
 */
export const Sets = model<ISet>('Set', setSchema);
