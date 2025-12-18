/**
 * Script para migrar las rarezas de las cartas existentes en la base de datos
 * de los valores de TCGdex (ej: "Ultra Rare") a los valores del enum TypeCardRarity (ej: "Rare Ultra")
 * 
 * Uso: node scripts/migrate_rarities.mjs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Cargar variables de entorno desde la raíz del servidor
dotenv.config({ path: join(__dirname, '..', '.env') });
// Mapeo de rarezas (debe coincidir con mapRarityFromTCGdex en utils.ts)
// Formato: { 'rareza_en_bd': 'rareza_correcta_del_enum' }
const rarityMap = {
  // Ultra Rare y variantes
  'Ultra Rare': 'Rare Ultra',
  // Hyper Rare y variantes
  'Hyper Rare': 'Rare Hiper',
  'Rare Hyper': 'Rare Hiper',
  'Secret Rare': 'Rare Hiper',
  'Rare Secret': 'Rare Hiper',
  'Rare Rainbow': 'Rare Hiper',
  // Illustration Rare y variantes (case sensitive)
  'Illustration rare': 'Rare Illustration',
  'illustration rare': 'Rare Illustration',
  'Illustration Rare': 'Rare Illustration',
  // Special Illustration Rare y variantes
  'Special illustration rare': 'Rare Special Illustration',
  'special illustration rare': 'Rare Special Illustration',
  'Special Illustration rare': 'Rare Special Illustration',
  'Special Illustration Rare': 'Rare Special Illustration',
  // Double Rare y variantes
  'Double rare': 'Rare Double',
  'double rare': 'Rare Double',
  'Double Rare': 'Rare Double',
  // Holo Rare y variantes
  'Holo Rare': 'Rare',
  'Rare Holo': 'Rare',
  // Variantes V, VMAX, VSTAR (Ultra Rare)
  'Rare Holo V': 'Rare Ultra',
  'Rare Holo VMAX': 'Rare Ultra',
  'Rare Holo VSTAR': 'Rare Ultra',
  'Holo Rare V': 'Rare Ultra',
  'Holo Rare VMAX': 'Rare Ultra',
  'Holo Rare VSTAR': 'Rare Ultra',
  'Rare Shiny': 'Rare Ultra',
  // Rarezas especiales de sets nuevos
  'Four Diamond': 'Rare Hiper',
  'Three Diamond': 'Rare Ultra',
  'Two Diamond': 'Rare Double',
  'One Diamond': 'Rare',
  'Two Star': 'Rare Ultra',
  'One Star': 'Rare',
  // None -> Common
  'None': 'Common',
  'none': 'Common',
};
async function migrateRarities() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cardgame';
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    // Obtener todas las colecciones de cartas
    const collections = ['pokemoncards', 'trainercards', 'energycards'];
    let totalUpdated = 0;
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      // Contar total de documentos
      const totalDocs = await collection.countDocuments();
      let updatedInCollection = 0;
      // Procesar cada mapeo
      for (const [oldRarity, newRarity] of Object.entries(rarityMap)) {
        const result = await collection.updateMany(
          { rarity: oldRarity },
          { $set: { rarity: newRarity } }
        );
        if (result.modifiedCount > 0) {
          updatedInCollection += result.modifiedCount;
        }
      }
      if (updatedInCollection === 0) {
      } else {
      }
      totalUpdated += updatedInCollection;
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
  }
}
// Ejecutar la migración
migrateRarities();
