import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
const mocks = vi.hoisted(() => {
  return {
    findById: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
  };
});
vi.mock('../../../src/app/models/userModel', () => {
  return {
    __esModule: true,
    default: {
      findById: mocks.findById,
      findOne: mocks.findOne,
    },
  };
});
import * as updateController from '../../../src/app/auth/updateProfile';
describe('Update Profile Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockUserInstance: any;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      user: { _id: 'my_user_id' } as any, 
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    mockUserInstance = {
      _id: 'my_user_id',
      username: 'OldUsername',
      email: 'test@test.com',
      profileImageUrl: 'https://old-image.com/img.png',
      save: mocks.save, 
    };
    mocks.save.mockResolvedValue(mockUserInstance);
  });
  it('debería devolver 404 si el usuario no se encuentra en la BD', async () => {
    mocks.findById.mockResolvedValue(null);
    await updateController.updateProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
  it('debería devolver 400 si el nuevo username ya está en uso', async () => {
    mocks.findById.mockResolvedValue(mockUserInstance);
    req.body = { username: 'TakenName' };
    mocks.findOne.mockResolvedValue({ _id: 'other_user_id' });
    await updateController.updateProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe('Ese nombre de usuario ya está en uso');
  });
  it('debería devolver 400 si la URL del avatar no es válida', async () => {
    mocks.findById.mockResolvedValue(mockUserInstance);
    req.body = { profileImageUrl: 'esto no es una url' };
    await updateController.updateProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toContain('La URL de la imagen no es válida');
  });
  it('debería actualizar correctamente username y avatar si los datos son válidos', async () => {
    mocks.findById.mockResolvedValue(mockUserInstance);
    mocks.findOne.mockResolvedValue(null);
    req.body = { 
      username: 'NewCoolName', 
      profileImageUrl: 'https://google.com/new-avatar.png' 
    };
    await updateController.updateProfile(req as Request, res as Response, next);
    expect(mockUserInstance.username).toBe('NewCoolName');
    expect(mockUserInstance.profileImageUrl).toBe('https://google.com/new-avatar.png');
    expect(mocks.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('debería restaurar la imagen por defecto si se envía una cadena vacía', async () => {
    mocks.findById.mockResolvedValue(mockUserInstance);
    req.body = { profileImageUrl: '' }; 
    await updateController.updateProfile(req as Request, res as Response, next);
    expect(mockUserInstance.profileImageUrl).toBe('https://images.pokemontcg.io/base1/4.png');
    expect(mocks.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});