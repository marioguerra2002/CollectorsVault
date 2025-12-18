import express from 'express';
import { Series } from '../models/serieModel.js';
import type { ISeries } from '../interface/ISeries.js';
import { tcgdex } from '../utils/utils.js';
import { dataclassToDict } from '../utils/utils.js';

/**
 * @desc Router para gestionar las series de cartas.
 */
export const serieRouter = express.Router();

/**
 * @desc Crear una nueva serie en la base de datos.
 * @route POST /series
 * @access Public
 */
serieRouter.post("/series", async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }
  
  try {
    const existingSerie = await Series.findOne({ id });
    if (existingSerie) {
      return res.status(200).json({ message: "Serie with this ID already exists", existingSerie });
    }
    
    const apiResponse = await tcgdex.serie.get(id);
    const serieDict = dataclassToDict(apiResponse);
    const serieJSON = JSON.stringify(serieDict, null, 2);
    const serieData = JSON.parse(serieJSON) as ISeries;
    const newSerie = new Series(serieData);
    
    await newSerie.save();
    res.status(201).json({ message: "Serie created successfully", newSerie });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Serie with this ID already exists" });
    }
    res.status(500).json({ message: "Error creating serie", error });
  }
});

/** 
 * @desc Obtener una serie por su ID único de la base de datos.
 * @route GET /series/:_id
 * @access Public
*/
serieRouter.get("/series/:_id", async (req, res) => {
  const { _id } = req.params;
  
  try {
    const serie = await Series.findOne({ _id });
    if (!serie) {
      return res.status(404).json({ message: "Serie not found" });
    }
    res.status(200).json(serie);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving serie", error });
  }
});

/** 
 * @desc Obtener todas las series o filtrar por nombre.
 * @route GET /series
 * @access Public
 */
serieRouter.get("/series", async (req, res) => {
  const filter = req.query.name ? { name: req.query.name.toString() } : {};
  
  try {
    const series = await Series.find(filter);
    res.status(200).json(series);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving series", error });
  }
});

/**
 * @desc Obtener una serie por su ID de serie (no el _id de MongoDB).
 * @route GET /series/id/:id
 * @access Public
 */
serieRouter.get("/series/:id", async (req, res) => {
  try {
    const query = req.params.id
    const serie = await Series.findOne({ id: query });
    if (!serie) {
      return res.status(404).json({ message: "Serie not found" });
    }
    res.status(200).json(serie);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving serie", error });
  }
});

/**
 * @desc Eliminar una serie de la base de datos según su ID único.
 * @route DELETE /series/:id
 * @access Public
 */
serieRouter.delete("/series/:id", async (req, res) => {
  try {
    const query = req.params.id
    const deletedSerie = await Series.findOneAndDelete({ _id: query });
    if (!deletedSerie) {
      return res.status(404).json({ message: "Serie not found" });
    }
    res.status(200).json({ message: "Serie deleted successfully", deletedSerie });
  } catch (error) {
    res.status(500).json({ message: "Error deleting serie", error });
  }
});  