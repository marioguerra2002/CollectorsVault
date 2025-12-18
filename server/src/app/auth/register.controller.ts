import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import type { IUser } from '../interface/IUsers';
/**
 * @desc    Registra un nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  // 1. Validar que los campos lleguen
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Por favor, complete todos los campos');
  }
  // 2. Validar formato de contraseña
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('La contraseña debe tener al menos una letra y un número');
  }
  // 3. Verificar si el usuario ya existe (por email o username)
  const userExists = await User.findOne<IUser>({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('El usuario o email ya existen');
  }
  // 3. Crear el nuevo usuario
  // La contraseña se hashea automáticamente gracias al middleware 'pre-save' en tu userModel
  const newUser = new User({
    username,
    email,
    password,
  });
  // 4. Guardar el usuario en la BD
  await newUser.save();
  if (newUser) {
    // No generamos token aquí. El usuario debe hacer login después de registrarse.
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      message: 'Usuario registrado exitosamente. Por favor, inicie sesión.'
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});