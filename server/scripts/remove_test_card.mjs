import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
// localizar server/.env (soporta ejecutar desde raíz o desde server/)
const cwd = process.cwd();
let envPath = path.join(cwd, 'server', '.env');
if (path.basename(cwd) === 'server') envPath = path.join(cwd, '.env');
dotenv.config({ path: envPath });
// fallback parse
if (!process.env.MONGODB_URI) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    const m = raw.match(/MONGODB_URI\s*=\s*["']?([^"'\n\r]+)["']?/);
    if (m && m[1]) process.env.MONGODB_URI = m[1].trim();
  } catch (err) {
    // ignore
  }
}
const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI no definida en .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  // Buscar carta de prueba por nombre o por id que empiece con 'local-'
  const card = await db.collection('pokemoncards').findOne({ $or: [ { name: 'Test Pokemon Card' }, { id: { $regex: '^local-' } } ] });
  if (!card) {
    await mongoose.disconnect();
    process.exit(0);
  }
  const cardId = card._id;
  // Eliminar la carta
  const del = await db.collection('pokemoncards').deleteOne({ _id: cardId });
  // Remover referencias en usuarios
  const update = await db.collection('users').updateMany(
    { cardCollection: cardId },
    { $pull: { cardCollection: cardId } }
  );
  await mongoose.disconnect();
  process.exit(0);
};
run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
