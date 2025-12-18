import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// mock de User.findById
const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
}));
vi.mock('../../../src/app/models/userModel', () => ({
  default: {
    findById: mocks.findById,
  },
}));
import { protect } from '../../../src/app/middleware/authMiddleware';
describe('Auth Middleware (protect)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  beforeEach(() => {
    vi.clearAllMocks();
    req = { 
      cookies: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    process.env.JWT_SECRET = 'test_secret';
  });
  it('debería devolver 401 si no hay token en las cookies', async () => {
    req.cookies = {};
    await protect(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No hay token de autenticación',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('debería devolver 401 si el token es inválido o ha expirado', async () => {
    req.cookies = { jwt: 'invalid_token' };
    // jwt.verify lanza error
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });
    await protect(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token inválido o expirado',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('debería devolver 401 si el token es válido pero el usuario ya no existe', async () => {
    req.cookies = { jwt: 'valid_token' };
    // token válido
    vi.spyOn(jwt, 'verify').mockReturnValue({ userId: 'user_123' } as any);
    // usuario no encontrado
    mocks.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });
    await protect(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Usuario no encontrado',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('debería llamar a next() y adjuntar el usuario si todo es correcto', async () => {
    req.cookies = { jwt: 'valid_token' };
    const mockUser = { _id: 'user_123', username: 'Ash' };
    // token válido
    vi.spyOn(jwt, 'verify').mockReturnValue({ userId: 'user_123' } as any);
    // devuelve un usuario válido
    mocks.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });
    await protect(req as Request, res as Response, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect((req as any).user).toEqual(mockUser);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
