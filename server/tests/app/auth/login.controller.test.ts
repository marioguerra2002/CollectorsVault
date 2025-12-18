import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
// los espías del mock
const mocks = vi.hoisted(() => {
  return {
    findOne: vi.fn(),
    comparePassword: vi.fn(),
  };
});
vi.mock('../../../src/app/models/userModel', () => {
  return {
    __esModule: true,
    default: {
      findOne: mocks.findOne,
    },
  };
});
// mockeo JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'fake_token'),
  },
}));
import * as loginController from '../../../src/app/auth/login.controller';
import User from '../../../src/app/models/userModel';
describe('Login Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  // antes de cada test limpiamos los mocks y preparamos req, res, next
  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn(),
    };
    next = vi.fn();
  });
  it('debería devolver 400 si faltan email o password', async () => {
    req.body = { email: '', password: '' };
    await loginController.loginUser(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe('Por favor, complete todos los campos');
  });
  it('debería devolver 401 si el usuario no existe', async () => {
    req.body = { email: 'noexiste@test.com', password: '123' };
    // el mock devuelve null (usuario no encontrado)
    mocks.findOne.mockResolvedValue(null);
    await loginController.loginUser(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe('Email o contraseña inválidos');
  });
  it('debería devolver 401 si la contraseña es incorrecta', async () => {
    req.body = { email: 'test@test.com', password: 'wrongpassword' };
    // usuario encontrado
    const mockUser = {
      _id: 'user_id_123',
      email: 'test@test.com',
      // contraseña erronea
      comparePassword: vi.fn().mockResolvedValue(false),
    };
    mocks.findOne.mockResolvedValue(mockUser);
    await loginController.loginUser(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
  it('debería devolver 200, token y datos de usuario si el login es exitoso', async () => {
    req.body = { email: 'test@test.com', password: 'correctpassword' };
    // todo correcto
    const mockUser = {
      _id: 'user_id_123',
      username: 'TestUser',
      email: 'test@test.com',
      comparePassword: vi.fn().mockResolvedValue(true),
    };
    mocks.findOne.mockResolvedValue(mockUser);
    await loginController.loginUser(req as Request, res as Response, next);
    // checks
    expect(next).not.toHaveBeenCalled(); 
    expect(res.cookie).toHaveBeenCalledWith('jwt', 'fake_token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      _id: 'user_id_123',
      username: 'TestUser',
      email: 'test@test.com',
    });
  });
});