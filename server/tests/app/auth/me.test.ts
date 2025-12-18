import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import * as meController from '../../../src/app/auth/me';
describe('Get Me Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });
  it('debería devolver 200 y los datos del usuario si está autenticado', async () => {
    // suponer que el middleware ya hizo su trabajo
    // y colocó un usuario en req.user
    req.user = {
      _id: 'user_123',
      username: 'AshKetchum',
      email: 'ash@test.com',
      profileImageUrl: 'https://example.com/ash.png'
    } as any; // Cast as any para evitar líos de tipos con Mongoose Document
    await meController.getMe(req as Request, res as Response, next);
    // checks
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      _id: 'user_123',
      username: 'AshKetchum',
      email: 'ash@test.com',
      profileImageUrl: 'https://example.com/ash.png'
    });
    expect(next).not.toHaveBeenCalled(); 
  });
  it('debería usar la imagen por defecto si el usuario no tiene avatar', async () => {
    // usuario sin profileImage
    req.user = {
      _id: 'user_456',
      username: 'Misty',
      email: 'misty@test.com',
      // profileImageUrl es undefined
    } as any;
    await meController.getMe(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      username: 'Misty',
      // devolver la imagen default
      profileImageUrl: 'https://images.pokemontcg.io/base1/4.png', 
    }));
  });
  it('debería devolver 404 si por alguna razón req.user no existe', async () => {
    // middleware falló o se saltó, y req.user está vacío
    req.user = undefined;
    await meController.getMe(req as Request, res as Response, next);
    // checks
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe('Usuario no encontrado');
  });
});