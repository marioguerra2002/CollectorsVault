import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }
  try {
    await mongoose.connect(mongoUri);
    console.log('Conexión a MongoDB establecida exitosamente.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};
export default connectDB;