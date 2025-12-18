/**
 * Script para verificar todas las rarezas únicas en la base de datos
 * y compararlas con el enum TypeCardRarity
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
async function checkRarities() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cardgame';
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const collections = ['pokemoncards', 'trainercards', 'energycards'];
    const allRarities = new Set();
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const rarities = await collection.distinct('rarity');
      rarities.forEach(rarity => {
        if (rarity) {
          allRarities.add(rarity);
        }
      });
    }
    const sortedRarities = Array.from(allRarities).sort();
    sortedRarities.forEach((rarity, index) => {
    });
    const enumRarities = [
      'Common',
      'Uncommon',
      'Rare',
      'Rare Double',
      'Rare Illustration',
      'Rare Special Illustration',
      'Rare Ultra',
      'Rare Hiper',
      'Reverse Holo',
      'Promo'
    ];
    enumRarities.forEach((rarity, index) => {
    });
    const unmapped = sortedRarities.filter(r => !enumRarities.includes(r));
    if (unmapped.length === 0) {
    } else {
      unmapped.forEach((rarity, index) => {
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}
checkRarities();
