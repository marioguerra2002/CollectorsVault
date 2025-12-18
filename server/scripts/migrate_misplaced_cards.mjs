import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// Carga dotenv intentando distintas rutas (compatibilidad con workspace)
const cwd = process.cwd();
let envPath = path.join(cwd, 'server', '.env');
if (path.basename(cwd) === 'server') envPath = path.join(cwd, '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no definida en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  // Buscamos documentos en pokemoncards cuya `category` indique que son Trainer/Energy
  const cursor = db.collection('pokemoncards').find({ category: { $exists: true, $ne: null } });
  let moved = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    const cat = (doc.category || '').toString().toLowerCase();
    let targetCollection = null;
    if (cat.startsWith('train')) targetCollection = 'trainercards';
    else if (cat.startsWith('ener')) targetCollection = 'energycards';
    if (targetCollection) {
      // Insertamos el documento en la colección destino conservando el mismo _id
      try {
        await db.collection(targetCollection).insertOne(doc);
        await db.collection('pokemoncards').deleteOne({ _id: doc._id });
        moved += 1;
      } catch (err) {
        console.error('Error moviendo documento', doc._id, err.message || err);
      }
    }
  }
  await mongoose.disconnect();
}
run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
