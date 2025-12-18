import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

// Mocks hoisted so they apply before importing the router
const cardMocks = vi.hoisted(() => {
  // Create real constructor functions that can be instantiated with 'new'
  function PokemonCardConstructor(this: any, data: any) {
    Object.assign(this, data);
  }
  PokemonCardConstructor.find = vi.fn();
  PokemonCardConstructor.findById = vi.fn();
  PokemonCardConstructor.findOneAndDelete = vi.fn();
  PokemonCardConstructor.findOneAndUpdate = vi.fn();
  PokemonCardConstructor.prototype.save = vi.fn();

  function TrainerCardConstructor(this: any, data: any) {
    Object.assign(this, data);
  }
  TrainerCardConstructor.find = vi.fn();
  TrainerCardConstructor.findById = vi.fn();
  TrainerCardConstructor.findOneAndDelete = vi.fn();
  TrainerCardConstructor.findOneAndUpdate = vi.fn();
  TrainerCardConstructor.prototype.save = vi.fn();

  function EnergyCardConstructor(this: any, data: any) {
    Object.assign(this, data);
  }
  EnergyCardConstructor.find = vi.fn();
  EnergyCardConstructor.findById = vi.fn();
  EnergyCardConstructor.findOneAndDelete = vi.fn();
  EnergyCardConstructor.findOneAndUpdate = vi.fn();
  EnergyCardConstructor.prototype.save = vi.fn();

  return {
    PokemonCard: PokemonCardConstructor,
    TrainerCard: TrainerCardConstructor,
    EnergyCard: EnergyCardConstructor,
    tcgdex: {
      card: {
        get: vi.fn(),
      },
    },
  };
});

vi.mock('../../../src/app/models/cards/pokemonCardModel', () => ({
  PokemonCard: cardMocks.PokemonCard,
}));
vi.mock('../../../src/app/models/cards/trainerCardModel', () => ({
  TrainerCard: cardMocks.TrainerCard,
}));
vi.mock('../../../src/app/models/cards/energyCardModel', () => ({
  EnergyCard: cardMocks.EnergyCard,
}));
vi.mock('../../../src/app/utils/utils', () => ({
  tcgdex: cardMocks.tcgdex,
  dataclassToDict: (data: any) => data,
  mapRarityFromTCGdex: (rarity: string) => rarity?.toLowerCase() || 'common',
  API_URL: 'https://api.tcgdex.net',
}));

vi.mock('../../../src/app/middleware/authMiddleware', () => ({
  protect: (_req: any, _res: any, next: any) => next(),
}));

import { cardRouter } from '../../../src/app/routers/cardRouter';

function getRouteHandler(path: string, method = 'get') {
  // @ts-ignore - express internals
  const stack = (cardRouter as any).stack as any[];
  for (const layer of stack) {
    if (!layer.route) continue;
    if (layer.route.path === path && layer.route.methods[method]) {
      const routeStack = layer.route.stack;
      return routeStack[routeStack.length - 1].handle;
    }
  }
  throw new Error(`Handler not found: ${path} (${method})`);
}

describe('cardRouter', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: new ObjectId('000000000000000000000123') } as any,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
  });

  describe('POST /cards', () => {
    const handler = () => getRouteHandler('/cards', 'post');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.body = { id: 'card123', category: 'pokemon' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autorizado' });
    });

    it('debe devolver 400 si no hay ID de carta', async () => {
      req.body = { category: 'pokemon' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID is required' });
    });

    it('debe crear una carta Pokemon exitosamente', async () => {
      const mockApiResponse = {
        id: 'p1',
        name: 'Pikachu',
        category: 'pokemon',
        image: 'http://image.url',
        attacks: [{ name: 'Thunderbolt', damage: '90' }],
        rarity: 'rare',
      };
      
      cardMocks.tcgdex.card.get.mockResolvedValue(mockApiResponse);
      
      // Mock the save method on the prototype
      cardMocks.PokemonCard.prototype.save = vi.fn().mockResolvedValue({ 
        _id: 'card123', 
        ...mockApiResponse, 
        owner: 'user123', 
        isTradable: true 
      });

      req.body = { id: 'p1', category: 'pokemon', condition: 'mint', isTradable: true };
      
      await handler()!(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Pokemon Card created successfully',
        })
      );
    });

    it('debe crear una carta Trainer exitosamente', async () => {
      const mockApiResponse = {
        id: 't1',
        name: 'Professor Oak',
        category: 'trainer',
        image: 'http://image.url',
        rarity: 'uncommon',
      };
      
      cardMocks.tcgdex.card.get.mockResolvedValue(mockApiResponse);
      
      // Mock the save method on the prototype
      cardMocks.TrainerCard.prototype.save = vi.fn().mockResolvedValue({ 
        _id: 'card124', 
        ...mockApiResponse, 
        owner: 'user123' 
      });

      req.body = { id: 't1', category: 'trainer', isTradable: false };
      
      await handler()!(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe crear una carta Energy exitosamente', async () => {
      const mockApiResponse = {
        id: 'e1',
        name: 'Lightning Energy',
        category: 'energy',
        image: 'http://image.url',
        rarity: 'common',
      };
      
      cardMocks.tcgdex.card.get.mockResolvedValue(mockApiResponse);
      
      // Mock the save method on the prototype
      cardMocks.EnergyCard.prototype.save = vi.fn().mockResolvedValue({ 
        _id: 'card125', 
        ...mockApiResponse, 
        owner: 'user123' 
      });

      req.body = { id: 'e1', category: 'energy' };
      
      await handler()!(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe manejar error interno en POST /cards', async () => {
      cardMocks.tcgdex.card.get.mockRejectedValue(new Error('API error'));
      req.body = { id: 'p1', category: 'pokemon' };
      
      await handler()!(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error creating card' })
      );
    });
  });

  describe('GET /collection', () => {
    const handler = () => getRouteHandler('/collection', 'get');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe obtener la colección del usuario actual', async () => {
      const mockPokemonCards = [{ _id: 'p1', name: 'Pikachu' }];
      const mockTrainerCards = [{ _id: 't1', name: 'Oak' }];
      const mockEnergyCards = [{ _id: 'e1', name: 'Lightning' }];

      cardMocks.PokemonCard.find.mockResolvedValue(mockPokemonCards);
      cardMocks.TrainerCard.find.mockResolvedValue(mockTrainerCards);
      cardMocks.EnergyCard.find.mockResolvedValue(mockEnergyCards);

      req.query = {};
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([...mockPokemonCards, ...mockTrainerCards, ...mockEnergyCards])
      );
    });

    it('debe obtener la colección de otro usuario por userId', async () => {
      const mockCards = [{ _id: 'p1', name: 'Pikachu', owner: 'otherUser' }];
      cardMocks.PokemonCard.find.mockResolvedValue(mockCards);
      cardMocks.TrainerCard.find.mockResolvedValue([]);
      cardMocks.EnergyCard.find.mockResolvedValue([]);

      req.query = { userId: 'otherUser' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe manejar error interno', async () => {
      cardMocks.PokemonCard.find.mockRejectedValue(new Error('DB error'));
      req.query = {};
      
      await handler()!(req as Request, res as Response);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error fetching collection' })
      );
    });
  });

  describe('GET /collection/:userId', () => {
    const handler = () => getRouteHandler('/collection/:userId', 'get');

    it('debe obtener la colección de un usuario específico', async () => {
      const mockCards = [{ _id: 'p1', name: 'Pikachu' }];
      cardMocks.PokemonCard.find.mockResolvedValue(mockCards);
      cardMocks.TrainerCard.find.mockResolvedValue([]);
      cardMocks.EnergyCard.find.mockResolvedValue([]);

      req.params = { userId: 'user456' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining(mockCards)
      );
    });
  });

  describe('GET /cards/traders/:cardApiId', () => {
    const handler = () => getRouteHandler('/cards/traders/:cardApiId', 'get');

    it('debe devolver traders con cartas intercambiables', async () => {
      const mockTraders = [
        {
          _id: 'card1',
          id: 'p1',
          condition: 'mint',
          isTradable: true,
          owner: { _id: 'user2', username: 'Ash' },
        },
      ];

      cardMocks.PokemonCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTraders),
      });
      cardMocks.TrainerCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });
      cardMocks.EnergyCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      req.params = { cardApiId: 'p1' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /cards/search-owners', () => {
    const handler = () => getRouteHandler('/cards/search-owners', 'get');

    it('debe devolver 400 si no hay parámetro name', async () => {
      req.query = {};
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name query parameter is required' });
    });

    it('debe buscar cartas por nombre', async () => {
      const mockCards = [
        { _id: 'p1', id: 'p1', name: 'Pikachu', owner: { username: 'Ash' } },
      ];

      cardMocks.PokemonCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCards),
      });
      cardMocks.TrainerCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });
      cardMocks.EnergyCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      req.query = { name: 'Pika' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe filtrar resultados sin propietario', async () => {
      const mockCards = [
        { _id: 'p1', name: 'Pikachu', owner: { username: 'Ash' } },
        { _id: 'p2', name: 'Pikachu Clone', owner: null },
      ];

      cardMocks.PokemonCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCards),
      });
      cardMocks.TrainerCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });
      cardMocks.EnergyCard.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      req.query = { name: 'Pikachu' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /cards/:id', () => {
    const handler = () => getRouteHandler('/cards/:id', 'get');

    it('debe devolver 400 si el ID no es válido', async () => {
      req.params = { id: 'invalid-id' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid card ID format' });
    });

    it('debe obtener una carta existente', async () => {
      const mockCard = { _id: '507f1f77bcf86cd799439011', name: 'Pikachu', id: 'p1' };
      
      cardMocks.PokemonCard.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockCard),
      });
      cardMocks.TrainerCard.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      cardMocks.EnergyCard.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      req.params = { id: '507f1f77bcf86cd799439011' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Pikachu', tcgdexId: 'p1' })
      );
    });

    it('debe devolver 404 si la carta no existe', async () => {
      cardMocks.PokemonCard.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      cardMocks.TrainerCard.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      cardMocks.EnergyCard.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      req.params = { id: '507f1f77bcf86cd799439011' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Card not found' });
    });

    it('debe manejar error interno', async () => {
      cardMocks.PokemonCard.findById.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('DB error')),
      });

      req.params = { id: '507f1f77bcf86cd799439011' };
      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error fetching card details' })
      );
    });
  });

  describe('DELETE /cards/:id', () => {
    const handler = () => getRouteHandler('/cards/:id', 'delete');

    it('debe devolver 401 si no hay usuario', async () => {
      req.user = undefined;
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {};

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe eliminar una carta existente sin categoría especificada', async () => {
      const mockCard = { _id: '507f1f77bcf86cd799439011', name: 'Pikachu' };

      cardMocks.PokemonCard.findOneAndDelete.mockResolvedValue(mockCard);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {};

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Card deleted successfully',
        deletedCard: mockCard,
      });
    });

    it('debe eliminar una carta Pokemon por categoría', async () => {
      const mockCard = { _id: '507f1f77bcf86cd799439011', name: 'Pikachu', category: 'pokemon' };

      cardMocks.PokemonCard.findOneAndDelete.mockResolvedValue(mockCard);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { category: 'pokemon' };

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe devolver 404 si la carta no existe', async () => {
      cardMocks.PokemonCard.findOneAndDelete.mockResolvedValue(null);
      cardMocks.TrainerCard.findOneAndDelete.mockResolvedValue(null);
      cardMocks.EnergyCard.findOneAndDelete.mockResolvedValue(null);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {};

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Card not found or you don't own it",
      });
    });

    it('debe manejar error interno', async () => {
      cardMocks.PokemonCard.findOneAndDelete.mockRejectedValue(new Error('DB error'));

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {};

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('PATCH /cards/:id/tradable', () => {
    const handler = () => getRouteHandler('/cards/:id/tradable', 'patch');

    it('debe devolver 401 si no hay usuario', async () => {
      req.user = undefined;
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { isTradable: true };

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe devolver 400 si isTradable no es boolean', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { isTradable: 'true' };

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'isTradable must be a boolean',
      });
    });

    it('debe actualizar el estado tradable de una carta', async () => {
      const mockCard = { _id: '507f1f77bcf86cd799439011', name: 'Pikachu', isTradable: true };

      cardMocks.PokemonCard.findOneAndUpdate.mockResolvedValue(mockCard);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { isTradable: true };

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Card tradable status updated',
        updatedCard: mockCard,
      });
    });

    it('debe devolver 404 si la carta no existe', async () => {
      cardMocks.PokemonCard.findOneAndUpdate.mockResolvedValue(null);
      cardMocks.TrainerCard.findOneAndUpdate.mockResolvedValue(null);
      cardMocks.EnergyCard.findOneAndUpdate.mockResolvedValue(null);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { isTradable: true };

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar error interno', async () => {
      cardMocks.PokemonCard.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { isTradable: false };

      await handler()!(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
