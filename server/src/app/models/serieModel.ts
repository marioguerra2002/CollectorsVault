import {model, Schema} from 'mongoose';
import type { ISeries } from '../interface/ISeries.js';

/**
 * @desc Esquema de Mongoose para la entidad Serie
 * 
 * @id Identificador único de la serie (requerido).
 * @name Nombre de la serie (requerido).
 * @logo URL del logo de la serie (requerido).
 * @sets Conjunto de sets que pertenecen a la serie (requerido).
 */
const serieSchema = new Schema<ISeries>({
  id: { type: String, required: true , unique: true },
  name: { type: String, required: true },
  logo: { type: String, required: true },
  sets: { type: [Object], required: true },
});

/**
 * @desc Modelo de Mongoose para la entidad Serie
 */
export const Series = model<ISeries>('Serie', serieSchema);