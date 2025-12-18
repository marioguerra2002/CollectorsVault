import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
const mocks = vi.hoisted(() => {
  return {
    findOne: vi.fn(),
    save: vi.fn(),
  };
});
vi.mock('../../../src/app/models/userModel', () => {
  class MockUser {
    constructor(data: any) {
      // copiar los datos  
      Object.assign(this, data);
      // simular propiedades de Mongoose
      (this as any)._id = 'new_user_id_123';
      // espía 'save' a esta instancia
      (this as any).save = mocks.save;
    }
    // espía estático findOne
    static findOne = mocks.findOne;
  }
  return {
    __esModule: true,
    default: MockUser,
  };
});
import * as registerController from '../../../src/app/auth/register.controller'; 
describe('Register Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });
  it('debería devolver 400 si faltan campos obligatorios', async () => {
    req.body = { username: 'test', email: 'test@test.com' };
    await registerController.registerUser(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe('Por favor, complete todos los campos');
  });
  it('debería devolver 400 si la contraseña no cumple los requisitos', async () => {
    req.body = { username: 'duplicateUser', email: 'exist@test.com', password: '123' };
    mocks.findOne.mockResolvedValue({ _id: 'existing_id', email: 'exist@test.com' });
    await registerController.registerUser(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe('La contraseña debe tener al menos una letra y un número');
  });
  it('debería devolver 201 y crear el usuario si todo es correcto', async () => {
    req.body = { username: 'newUser', email: 'new@test.com', password: 'password123' };
    //  mocks para el caso de éxito
    mocks.findOne.mockResolvedValue(null); // no existe usuario previo
    mocks.save.mockResolvedValue(true);    // el guardado va bien
    await registerController.registerUser(req as Request, res as Response, next);
    // Verificaciones
    // 1. next NO debe haber sido llamado (significa que no hubo error)
    expect(next).not.toHaveBeenCalled();
    // 2. Se llamó a findOne y save
    expect(mocks.findOne).toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalled();    
    // 3. Se devolvió la respuesta correcta
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      username: 'newUser',
      email: 'new@test.com',
      message: expect.stringContaining('registrado exitosamente'),
    }));
  });
});