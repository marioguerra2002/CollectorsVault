import { Document, Types } from 'mongoose';
// /**
//  *
//  * Representa una notificación para el usuario.
//  */
// export interface INotification {
//   message: string;
//   type: 'tradeOffer' | 'tradeUpdate' | 'message' | 'system';
//   fromUser?: Types.ObjectId; // Quién envía la notificación (ej. para oferta de trade)
//   link?: string; // Enlace a la página relevante (ej. /trades/tradeId)
//   isRead: boolean;
//   createdAt: Date;
// }
/**
 * Interfaz principal para el documento de Usuario.
 * 
 * @username Nombre de usuario único.
 * @email Correo electrónico único del usuario.
 * @password Contraseña hasheada del usuario.
 * @profileImageUrl URL de la imagen de perfil del usuario (opcional).
 * @cardCollection Array de referencias a las cartas que posee el usuario.
 * @wishlist Array de IDs de cartas que el usuario desea.
 * @trades Array de referencias a los intercambios en los que participa el usuario.
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string; 
  profileImageUrl?: string;
  // cada id referencia un documento en la colección 'cards'
  cardCollection: Types.ObjectId[];
  // Array de IDs de cartas que el usuario desea
  wishlist: string[]; // Solo los cardId
  // Referencias a los intercambios en los que participa el usuario
  trades: Types.ObjectId[];
  // notifications se podria implementar más adelante? * no se como implementarlo bien *
  // notifications: INotification[];
  // metodo para comparar contraseñas
  comparePassword(candidatePassword: string): Promise<boolean>;
}