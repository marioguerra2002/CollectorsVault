import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
// Mocks hoisted so they apply before importing el router
const userMocks = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
}));
vi.mock('../../../src/app/models/userModel', () => ({
  default: {
    find: userMocks.find,
    findById: userMocks.findById,
  },
}));
// Protect middleware no-op (router imports it at definition time)
vi.mock('../../../src/app/middleware/authMiddleware', () => ({
  protect: (_req: any, _res: any, next: any) => next(),
}));
import { userRouter } from '../../../src/app/routers/userRouter';
function getRouteHandler(path: string, method = 'get') {
  // @ts-ignore - express internals
  const stack = (userRouter as any).stack as any[];
  for (const layer of stack) {
    if (!layer.route) continue;
    if (layer.route.path === path && layer.route.methods[method]) {
      // layer.route.stack: [ protect, handler ] -> handler at index 1
      const routeStack = layer.route.stack;
      return routeStack[routeStack.length - 1].handle;
    }
  }
  throw new Error('handler not found: ' + path);
}
describe('userRouter', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
  });
  describe('GET /users/search', () => {
    const handler = () => getRouteHandler('/users/search');
    it('debe devolver 400 si no hay query', async () => {
      req.query = {} as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Escribe algo para buscar' });
    });
    it('debe devolver usuarios cuando hay query', async () => {
      const users = [{ username: 'Ash' }];
      // mock chain: find(...).select(...).limit(...) -> resolves users
      userMocks.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(users),
      });
      req.query = { q: 'ash' } as any;
      // req.user used for exclusion
      (req as any).user = { _id: 'me' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });
    it('debe manejar error interno', async () => {
      userMocks.find.mockImplementation(() => { throw new Error('boom'); });
      req.query = { q: 'x' } as any;
      (req as any).user = { _id: 'me' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error buscando usuarios' });
    });
  });
  describe('GET /users/:userId', () => {
    const handler = () => getRouteHandler('/users/:userId');
    it('devuelve 404 si usuario no existe', async () => {
      userMocks.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      req.params = { userId: 'u1' } as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
    it('devuelve usuario si existe', async () => {
      const user = { username: 'Misty' };
      userMocks.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) });
      req.params = { userId: 'u2' } as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(user);
    });
    it('maneja error interno', async () => {
      userMocks.findById.mockImplementation(() => { throw new Error('err'); });
      req.params = { userId: 'u3' } as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error obteniendo usuario' });
    });
  });
  describe('GET /users/:userId/profileImageUrl', () => {
    const handler = () => getRouteHandler('/users/:userId/profileImageUrl');
    it('devuelve 404 si no existe', async () => {
      userMocks.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      req.params = { userId: 'u1' } as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
    it('devuelve url de imagen si existe', async () => {
      userMocks.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ profileImageUrl: 'http://img' }) });
      req.params = { userId: 'u2' } as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ profileImageUrl: 'http://img' });
    });
    it('maneja error interno', async () => {
      userMocks.findById.mockImplementation(() => { throw new Error('err'); });
      req.params = { userId: 'u3' } as any;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener la imagen de perfil' });
    });
  });
});
