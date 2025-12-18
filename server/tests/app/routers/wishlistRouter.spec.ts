import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Mocks para el modelo User
var mockFindById: any;
var mockSave: any;
vi.mock('../../../src/app/models/userModel.js', () => {
  mockFindById = vi.fn();
  mockSave = vi.fn().mockResolvedValue(true);
  // No necesitamos una clase completa, retornaremos objetos desde findById
  return { default: { findById: mockFindById } };
});
// Mocks para utils (tcgdex, dataclassToDict, mapRarityFromTCGdex)
var mockGet: any;
var mockDataclassToDict: any;
var mockMapRarity: any;
vi.mock('../../../src/app/utils/utils.js', () => {
  mockGet = vi.fn();
  mockDataclassToDict = vi.fn();
  mockMapRarity = vi.fn();
  return {
    tcgdex: { card: { get: mockGet } },
    dataclassToDict: mockDataclassToDict,
    mapRarityFromTCGdex: mockMapRarity,
  };
});
// Mock del middleware de protección para inyectar un usuario en req
vi.mock('../../../src/app/middleware/authMiddleware.js', () => {
  const protect = (req: any, res: any, next: any) => {
    req.user = { _id: 'user-1' };
    next();
  };
  return { protect };
});
// Importar el router después de establecer los mocks
import { wishlistRouter } from '../../../src/app/routers/wishlistRouter';
function createApp() {
  const app = express();
  app.use(express.json());
  app.use(wishlistRouter);
  return app;
}
beforeEach(() => {
  mockFindById.mockReset();
  mockSave.mockReset();
  mockGet.mockReset();
  mockDataclassToDict.mockReset();
  mockMapRarity.mockReset();
});
describe('wishlistRouter', () => {
  it('GET /wishlist returns 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null);
    const app = createApp();
    const res = await request(app).get('/wishlist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Usuario no encontrado');
  });
  it('GET /wishlist returns card details mapping rarity', async () => {
    const wishlistIds = ['sv1-1', 'xy-2'];
    // User object returned by findById
    const userObj: any = { wishlist: [...wishlistIds], save: mockSave };
    mockFindById.mockResolvedValue(userObj);
    const apiResponse1 = { id: 'sv1-1' };
    const apiResponse2 = { id: 'xy-2' };
    mockGet.mockImplementation((id: string) => {
      if (id === 'sv1-1') return Promise.resolve(apiResponse1);
      if (id === 'xy-2') return Promise.resolve(apiResponse2);
      return Promise.reject(new Error('Not found'));
    });
    const cardDict1 = { id: 'sv1-1', rarity: 'Rare' };
    const cardDict2 = { id: 'xy-2', rarity: 'Common' };
    mockDataclassToDict.mockImplementation((d: any) => {
      if (d === apiResponse1) return cardDict1;
      if (d === apiResponse2) return cardDict2;
      return null;
    });
    mockMapRarity.mockImplementation((r: any) => `mapped-${r}`);
    const app = createApp();
    const res = await request(app).get('/wishlist');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('id', 'sv1-1');
    expect(res.body[0]).toHaveProperty('rarity', 'mapped-Rare');
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockDataclassToDict).toHaveBeenCalledTimes(2);
    expect(mockMapRarity).toHaveBeenCalled();
  });
  it('POST /wishlist returns 400 when cardId missing', async () => {
    const app = createApp();
    const res = await request(app).post('/wishlist').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Falta cardId');
  });
  it('POST /wishlist returns 200 when already in wishlist', async () => {
    const userObj: any = { wishlist: ['sv1-1'], save: mockSave };
    mockFindById.mockResolvedValue(userObj);
    const app = createApp();
    const res = await request(app).post('/wishlist').send({ cardId: 'sv1-1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Ya está en tu lista');
  });
  it('POST /wishlist adds new card and returns updated wishlist', async () => {
    const userObj: any = { wishlist: [], save: mockSave };
    mockFindById.mockResolvedValue(userObj);
    const app = createApp();
    const res = await request(app).post('/wishlist').send({ cardId: 'new-card' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Añadida a wishlist');
    expect(res.body).toHaveProperty('wishlist');
    expect(res.body.wishlist).toContain('new-card');
    expect(mockSave).toHaveBeenCalled();
  });
  it('DELETE /wishlist/:cardId removes card from wishlist', async () => {
    const userObj: any = { wishlist: ['a', 'b', 'c'], save: mockSave };
    mockFindById.mockResolvedValue(userObj);
    const app = createApp();
    const res = await request(app).delete('/wishlist/b');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Eliminada de wishlist');
    expect(res.body.wishlist).not.toContain('b');
    expect(mockSave).toHaveBeenCalled();
  });
  it('DELETE /wishlist/:cardId returns 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null);
    const app = createApp();
    const res = await request(app).delete('/wishlist/x');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Usuario no encontrado');
  });
});
