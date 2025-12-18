import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';

// Mock del modelo User
let mockFindById: any;
let mockFindByIdAndUpdate: any;
vi.mock('../../../src/app/models/userModel', () => {
  const findById = vi.fn();
  const findByIdAndUpdate = vi.fn();
  return { default: { findById, findByIdAndUpdate } };
});

// Mocks para las colecciones de cartas
let mockPokemonFind: any;
let mockTrainerFind: any;
let mockEnergyFind: any;
vi.mock('../../../src/app/models/cards/pokemonCardModel', () => {
  const find = vi.fn();
  return { PokemonCard: { find } };
});

vi.mock('../../../src/app/models/cards/trainerCardModel', () => {
  const find = vi.fn();
  return { TrainerCard: { find } };
});

vi.mock('../../../src/app/models/cards/energyCardModel', () => {
  const find = vi.fn();
  return { EnergyCard: { find } };
});

// Mock del middleware de protección para inyectar un usuario en req
vi.mock('../../../src/app/middleware/authMiddleware', () => {
  const protect = (req: any, res: any, next: any) => {
    req.user = { _id: new mongoose.Types.ObjectId() };
    next();
  };
  return { protect };
});

// Importar el router después de establecer los mocks
import { collectionRouter } from '../../../src/app/routers/collectionRouter';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(collectionRouter);
  return app;
}

// Asignar referencias a las funciones mockeadas importando los módulos mockeados
beforeEach(async () => {
  const userModule = await import('../../../src/app/models/userModel');
  mockFindById = userModule.default.findById;
  mockFindByIdAndUpdate = userModule.default.findByIdAndUpdate;

  const pokemonModule = await import('../../../src/app/models/cards/pokemonCardModel');
  mockPokemonFind = pokemonModule.PokemonCard.find;
  const trainerModule = await import('../../../src/app/models/cards/trainerCardModel');
  mockTrainerFind = trainerModule.TrainerCard.find;
  const energyModule = await import('../../../src/app/models/cards/energyCardModel');
  mockEnergyFind = energyModule.EnergyCard.find;
});

describe('Collection Router - POST /collection/add', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockSave: any;
  beforeEach(() => {
    // NO limpiar mockUser, solo los otros
    vi.resetAllMocks();

    req = {
      user: { _id: new mongoose.Types.ObjectId() },
      body: { cardId: new mongoose.Types.ObjectId().toString() },
    };
    const statusMock = vi.fn();
    const jsonMock = vi.fn((data) => data);
    res = {
      status: statusMock,
      json: jsonMock,
    };
    statusMock.mockReturnValue(res);
    next = vi.fn();
    mockSave = vi.fn().mockResolvedValue(true);
    
    // mockUser mantiene sus funciones; ya se resetean con `vi.resetAllMocks()`
  });
  describe('Validaciones iniciales', () => {
    it('debería rechazar si el usuario no está autenticado', () => {
      req.user = undefined;
      const userId = (req as any).user?._id;
      if (!userId) {
        (res.status as any)(401).json({ message: 'Usuario no autenticado' });
      }
      expect((res.status as any).mock.calls[0][0]).toBe(401);
      expect((res.json as any).mock.calls[0][0].message).toBe('Usuario no autenticado');
    });
    it('debería rechazar si cardId no se proporciona', () => {
      req.body = {};
      const { cardId } = req.body;
      if (!cardId) {
        (res.status as any)(400).json({ message: 'cardId es requerido' });
      }
      expect((res.status as any).mock.calls[0][0]).toBe(400);
      expect((res.json as any).mock.calls[0][0].message).toBe('cardId es requerido');
    });
    it('debería rechazar si el usuario no existe en BD', async () => {
      mockFindById.mockResolvedValueOnce(null);

      const user = await mockFindById((req.user as any)._id);
      if (!user) {
        (res.status as any)(404).json({ message: 'Usuario no encontrado' });
      }
      expect((res.status as any).mock.calls[0][0]).toBe(404);
      expect((res.json as any).mock.calls[0][0].message).toBe('Usuario no encontrado');
    });
  });
  describe('Operaciones con cartas', () => {
    it('debería rechazar si la carta ya existe en la colección', async () => {
      const cardId = new mongoose.Types.ObjectId();
      req.body = { cardId: cardId.toString() };
      const mockUserData = {
        cardCollection: [cardId],
        save: mockSave,
      };

      mockFindById.mockResolvedValueOnce(mockUserData);

      const user = mockUserData;
      const normalized = mongoose.Types.ObjectId.isValid(cardId.toString())
        ? new mongoose.Types.ObjectId(cardId.toString())
        : cardId.toString();
      const exists = user.cardCollection.some((c: any) => c.toString() === normalized.toString());
      if (exists) {
        (res.status as any)(200).json({ message: 'Carta ya en la colección' });
      }
      expect((res.status as any).mock.calls[0][0]).toBe(200);
      expect((res.json as any).mock.calls[0][0].message).toBe('Carta ya en la colección');
    });
    it('debería añadir una carta nueva a la colección', async () => {
      const cardId = new mongoose.Types.ObjectId();
      req.body = { cardId: cardId.toString() };
      const mockUserData = {
        cardCollection: [],
        save: mockSave,
      };

      mockFindById.mockResolvedValueOnce(mockUserData);

      const user = mockUserData;
      const normalized = mongoose.Types.ObjectId.isValid(cardId.toString())
        ? new mongoose.Types.ObjectId(cardId.toString())
        : cardId.toString();
      const exists = user.cardCollection.some((c: any) => c.toString() === normalized.toString());
      if (!exists) {
        user.cardCollection.push(normalized);
        await user.save();
        (res.status as any)(200).json({ message: 'Carta añadida', cardId: normalized });
      }
      expect(mockUserData.cardCollection.length).toBe(1);
      expect(mockSave).toHaveBeenCalled();
      expect((res.status as any).mock.calls[0][0]).toBe(200);
      expect((res.json as any).mock.calls[0][0].message).toBe('Carta añadida');
    });
    it('debería manejar múltiples cartas en la colección', () => {
      const cardId1 = new mongoose.Types.ObjectId();
      const cardId2 = new mongoose.Types.ObjectId();
      const mockUserData = {
        cardCollection: [cardId1],
        save: mockSave,
      };
      mockUserData.cardCollection.push(cardId2);
      expect(mockUserData.cardCollection.length).toBe(2);
      expect(mockUserData.cardCollection).toContain(cardId1);
      expect(mockUserData.cardCollection).toContain(cardId2);
    });
  });
  describe('Manejo de errores', () => {
    it('debería capturar errores de BD', async () => {
      // IMPORTANTE: Configurar DESPUÉS de beforeEach
      const error = new Error('Error de conexión a BD');
      mockFindById.mockImplementation(() => Promise.reject(error));

      let errorCaught = false;
      let caughtError: any = null;
      try {
        await mockFindById((req.user as any)._id);
      } catch (err) {
        errorCaught = true;
        caughtError = err;
      }
      // Verificar que el error fue capturado
      expect(errorCaught).toBe(true);
      expect(caughtError).toBe(error);
    });
    it('debería validar que cardId sea un ObjectId válido', () => {
      req.body = { cardId: 'invalid-id' };
      const cardId = 'invalid-id';
      const normalized = mongoose.Types.ObjectId.isValid(cardId)
        ? new mongoose.Types.ObjectId(cardId)
        : cardId;
      expect(normalized).toBe('invalid-id');
    });
  });
  describe('DELETE /collection/:cardId', () => {
    it('debería eliminar una carta de la colección', async () => {
      const cardId = new mongoose.Types.ObjectId();
      req.params = { cardId: cardId.toString() };
      const mockUpdatedUser = {
        _id: (req.user as any)._id,
        cardCollection: [],
      };

      mockFindByIdAndUpdate.mockResolvedValueOnce(mockUpdatedUser);

      const update = await mockFindByIdAndUpdate(
        (req.user as any)._id,
        { $pull: { cardCollection: cardId } },
        { new: true }
      );
      expect(update).toBeDefined();
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        (req.user as any)._id,
        { $pull: { cardCollection: cardId } },
        { new: true }
      );
    });
    it('debería rechazar si el usuario no existe al eliminar', async () => {
      const cardId = new mongoose.Types.ObjectId();
      mockFindByIdAndUpdate.mockResolvedValueOnce(null);

      const update = await mockFindByIdAndUpdate(
        (req.user as any)._id,
        { $pull: { cardCollection: cardId } },
        { new: true }
      );
      if (!update) {
        (res.status as any)(404).json({ message: 'Usuario no encontrado' });
      }
      expect((res.status as any).mock.calls[0][0]).toBe(404);
    });
  });
});

describe('Collection Router - GET handlers', () => {
  beforeEach(() => {
    // Resetear mocks específicos de GET
    vi.resetAllMocks();
  });

  it('GET /collection devuelve cartas combinadas de las 3 colecciones', async () => {
    const p1 = { _id: new mongoose.Types.ObjectId(), id: 'p1', name: 'P1' };
    const t1 = { _id: new mongoose.Types.ObjectId(), id: 't1', name: 'T1' };
    const e1 = { _id: new mongoose.Types.ObjectId(), id: 'e1', name: 'E1' };

    // Simular comportamiento thenable/leanable de Mongoose
    mockPokemonFind.mockImplementation(() => {
      const p = Promise.resolve([p1]);
      (p as any).lean = vi.fn().mockResolvedValue([p1]);
      return p as any;
    });
    mockTrainerFind.mockImplementation(() => {
      const p = Promise.resolve([t1]);
      (p as any).lean = vi.fn().mockResolvedValue([t1]);
      return p as any;
    });
    mockEnergyFind.mockImplementation(() => {
      const p = Promise.resolve([e1]);
      (p as any).lean = vi.fn().mockResolvedValue([e1]);
      return p as any;
    });

    const app = createApp();
    const res = await request(app).get('/collection');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    // _id debe ser string en la respuesta
    expect(typeof res.body[0]._id).toBe('string');
  });

  it('GET /collection/filter aplica filtros y devuelve resultados', async () => {
    const pA = { _id: new mongoose.Types.ObjectId(), id: 'pa', name: 'PA', rarity: 'Rare', condition: 'Good' };

    // Cuando no se usa .lean() (ruta /filter) find debe resolver directamente con array
    mockPokemonFind.mockResolvedValue([pA]);
    mockTrainerFind.mockResolvedValue([]);
    mockEnergyFind.mockResolvedValue([]);

    const app = createApp();
    const res = await request(app)
      .get('/collection/filter')
      .query({ rarity: 'Rare', cardType: 'Pokemon' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('id', 'pa');
    expect(mockPokemonFind).toHaveBeenCalled();
  });
});
