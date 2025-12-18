import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '../interface/IUsers';

/**
 * @desc Schema principal para el modelo de Usuario.
 * 
 * @username Nombre de usuario único.
 * @email Correo electrónico único del usuario.
 * @password Contraseña hasheada del usuario.
 * @profileImageUrl URL de la imagen de perfil del usuario.
 * @collection Array de referencias a las cartas que posee el usuario.
 * @wishlist Array de IDs de cartas que el usuario desea.
 * @trades Array de referencias a los intercambios relacionados con el usuario.
 */
const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    index: true, 
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    validate: {
      validator: (value: string) => require('validator').isEmail(value),
      message: 'El email no es válido'
    }
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
  },
  profileImageUrl: {
    type: String,
    default: 'https://placehold.co/100x100/333/FFF?text=User'
  },
  cardCollection: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Card'
    }
  ],
  wishlist: [
    { type: String } 
  ],
  trades: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Trade' 
    }
  ],
}, {
  timestamps: true
});

// moongose pre-save
/**
 * middleware "pre-save" para hashear la contraseña antes de guardarla.
 * solo si la contraseña ha sido modificada.
 */
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  // hashear la contraseña
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});
/**
 * metodo para comparar la contraseña introducida con la hasheada en la BD.
 * @param candidatePassword la contraseña en texto plano para comparar.
 * @returns true si la contraseña coincide, false en caso contrario.
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
/**
 * creamos y exportamos el modelo 'User' basado en el userSchema.
 */
const User = model<IUser>('User', userSchema);
export default User;