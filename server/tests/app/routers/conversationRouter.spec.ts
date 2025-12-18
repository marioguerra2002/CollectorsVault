import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

vi.mock('../../../src/app/models/conversationModel', () => {
  function ConversationConstructor(this: any, data: any) {
    Object.assign(this, data);
  }
  ConversationConstructor.find = vi.fn();
  ConversationConstructor.findOne = vi.fn();
  ConversationConstructor.findOneAndDelete = vi.fn();
  ConversationConstructor.prototype.save = vi.fn();

  return {
    Conversation: ConversationConstructor,
  };
});

vi.mock('../../../src/app/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => next(),
}));

import { conversationRouter } from '../../../src/app/routers/conversationRouter';
import { Conversation } from '../../../src/app/models/conversationModel';


function getRouteHandler(path: string, method = 'get') {
  // @ts-ignore - express internals
  const stack = (conversationRouter as any).stack as any[];
  for (const layer of stack) {
    if (!layer.route) continue;
    if (layer.route.path === path && layer.route.methods[method]) {
      const routeStack = layer.route.stack;
      return routeStack[routeStack.length - 1].handle;
    }
  }
  throw new Error(`Handler not found: ${path} (${method})`);
}

describe('conversationRouter', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  const userId = new ObjectId('000000000000000000000001');
  const otherUserId = new ObjectId('000000000000000000000002');

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: userId } as any,
      params: {},
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /conversations', () => {
    const handler = () => getRouteHandler('/conversations', 'get');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver conversaciones vacías si el usuario no tiene ninguna', async () => {
      Conversation.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('debe devolver conversaciones del usuario formateadas correctamente', async () => {
      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: { _id: userId, username: 'user1', email: 'user1@test.com', profileImageUrl: 'url1' },
        user2: { _id: otherUserId, username: 'user2', email: 'user2@test.com', profileImageUrl: 'url2' },
        messages: [
          { fromUserId: userId, kind: 'text', payload: { text: 'Hola' }, createdAt: new Date() },
          { fromUserId: otherUserId, kind: 'text', payload: { text: 'Hola también' }, createdAt: new Date() },
        ],
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      Conversation.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([mockConversation]),
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: mockConversation._id,
            otherUserId,
            messageCount: 2,
            lastMessage: expect.any(Object),
          }),
        ])
      );
    });

    it('debe manejar errores en la base de datos', async () => {
      Conversation.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error obteniendo conversaciones',
      }));
    });
  });

  describe('GET /conversations/:otherUserId', () => {
    const handler = () => getRouteHandler('/conversations/:otherUserId', 'get');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver 400 si el otherUserId no es válido', async () => {
      req.params = { otherUserId: 'invalid-id' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID de usuario inválido' });
    });

    it('debe devolver una conversación vacía si no existe', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      Conversation.findOne = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: null,
          messages: [],
        })
      );
    });

    it('debe devolver una conversación existente', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: { _id: userId, username: 'user1', email: 'user1@test.com', profileImageUrl: 'url1' },
        user2: { _id: otherUserId, username: 'user2', email: 'user2@test.com', profileImageUrl: 'url2' },
        messages: [
          { fromUserId: userId, kind: 'text', payload: { text: 'Hola' }, createdAt: new Date() },
        ],
        createdAt: new Date(),
        lastMessageAt: new Date(),
      };

      Conversation.findOne = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockConversation),
        }),
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockConversation);
    });

    it('debe manejar errores en la base de datos', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      Conversation.findOne = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error obteniendo conversación',
      }));
    });
  });

  describe('DELETE /conversations/:otherUserId', () => {
    const handler = () => getRouteHandler('/conversations/:otherUserId', 'delete');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver 400 si el otherUserId no es válido', async () => {
      req.params = { otherUserId: 'invalid-id' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID de usuario inválido' });
    });

    it('debe devolver 404 si la conversación no existe', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      Conversation.findOneAndDelete = vi.fn().mockResolvedValue(null);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conversación no encontrada' });
    });

    it('debe eliminar una conversación exitosamente', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      const mockDeletedConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [],
      };

      Conversation.findOneAndDelete = vi.fn().mockResolvedValue(mockDeletedConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Conversación eliminada exitosamente',
          deletedConversationId: mockDeletedConversation._id,
        })
      );
    });

    it('debe manejar errores en la base de datos', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      Conversation.findOneAndDelete = vi.fn().mockRejectedValue(new Error('Database error'));

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error eliminando conversación',
      }));
    });
  });

  describe('GET /conversations/verify/:otherUserId', () => {
    const handler = () => getRouteHandler('/conversations/verify/:otherUserId', 'get');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe retornar exists: false si la conversación no existe', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      Conversation.findOne = vi.fn().mockResolvedValue(null);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        exists: false,
        conversationId: null,
        messageCount: 0,
        hasTradeProposal: false,
      });
    });

    it('debe retornar exists: true con datos si la conversación existe', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [
          { fromUserId: userId, kind: 'text', payload: { text: 'Hola' }, createdAt: new Date() },
        ],
        lastTradeProposal: {
          proposer: userId,
          proposal: { offering: ['card1'], requesting: ['card2'] },
          createdAt: new Date(),
        },
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        exists: true,
        conversationId: mockConversation._id,
        messageCount: 1,
        hasTradeProposal: true,
      });
    });
  });

  describe('POST /conversations/:otherUserId/trade-proposal', () => {
    const handler = () => getRouteHandler('/conversations/:otherUserId/trade-proposal', 'post');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { proposal: { offering: ['card1'], requesting: ['card2'] } };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver 400 si el otherUserId no es válido', async () => {
      req.params = { otherUserId: 'invalid-id' };
      req.body = { proposal: { offering: ['card1'], requesting: ['card2'] } };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID de usuario inválido' });
    });

    it('debe devolver 400 si no se proporciona proposal', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = {};
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'proposal es requerido' });
    });

    it('debe devolver 423 si la conversación está bloqueada', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { proposal: { offering: ['card1'], requesting: ['card2'] } };
      const mockLockedConversation = {
        _id: new ObjectId('000000000000000000000003'),
        isLocked: true,
        messages: [],
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockLockedConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La conversación está bloqueada y no acepta nuevas propuestas',
      });
    });

    it('debe crear una nueva conversación con propuesta', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      const proposal = { offering: ['card1'], requesting: ['card2'] };
      req.body = { proposal };

      Conversation.findOne = vi.fn().mockResolvedValue(null);

      let savedConversation: any;
      Conversation.prototype.save = vi.fn().mockImplementation(function (this: any) {
        savedConversation = this;
        return Promise.resolve();
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Propuesta de intercambio guardada exitosamente',
          data: expect.objectContaining({
            proposer: userId,
            proposal,
          }),
        })
      );
    });

    it('debe actualizar una conversación existente con nueva propuesta', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      const newProposal = { offering: ['card3'], requesting: ['card4'] };
      req.body = { proposal: newProposal };

      const existingConversation = {
        _id: new ObjectId('000000000000000000000003'),
        isLocked: false,
        messages: [],
        lastTradeProposal: {
          proposer: userId,
          proposal: { offering: ['card1'], requesting: ['card2'] },
          createdAt: new Date(),
        },
        save: vi.fn().mockResolvedValue(undefined),
      };

      Conversation.findOne = vi.fn().mockResolvedValue(existingConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Propuesta de intercambio guardada exitosamente',
        })
      );
    });
  });

  describe('GET /conversations/:otherUserId/trade-proposal', () => {
    const handler = () => getRouteHandler('/conversations/:otherUserId/trade-proposal', 'get');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver 400 si el otherUserId no es válido', async () => {
      req.params = { otherUserId: 'invalid-id' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID de usuario inválido' });
    });

    it('debe retornar null si no hay propuesta de intercambio', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      Conversation.findOne = vi.fn().mockResolvedValue(null);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ lastTradeProposal: null });
    });

    it('debe retornar la propuesta de intercambio existente', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      const mockProposal = {
        proposer: userId,
        proposal: { offering: ['card1'], requesting: ['card2'] },
        createdAt: new Date(),
      };

      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [],
        lastTradeProposal: mockProposal,
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ lastTradeProposal: mockProposal });
    });
  });

  describe('PATCH /conversations/:otherUserId/lock', () => {
    const handler = () => getRouteHandler('/conversations/:otherUserId/lock', 'patch');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { reason: 'accepted' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver 400 si el otherUserId no es válido', async () => {
      req.params = { otherUserId: 'invalid-id' };
      req.body = { reason: 'accepted' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID de usuario inválido' });
    });

    it('debe devolver 400 si reason no es válido', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { reason: 'invalid' };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'reason debe ser accepted | deleted',
      });
    });

    it('debe bloquear una conversación con reason: accepted', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { reason: 'accepted' };

      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [],
        isLocked: false,
        save: vi.fn().mockResolvedValue(undefined),
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Conversación bloqueada correctamente',
          systemMessage: expect.objectContaining({
            kind: 'system',
          }),
        })
      );
    });

    it('debe bloquear una conversación con reason: deleted', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { reason: 'deleted' };

      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [],
        isLocked: false,
        save: vi.fn().mockResolvedValue(undefined),
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Conversación bloqueada correctamente',
          systemMessage: expect.objectContaining({
            kind: 'system',
          }),
        })
      );
    });

    it('debe devolver 200 si la conversación ya está bloqueada con el mismo reason', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { reason: 'accepted' };

      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [],
        isLocked: true,
        lockedReason: 'accepted',
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'La conversación ya estaba bloqueada',
        })
      );
    });
  });

  describe('POST /conversations/:otherUserId/messages', () => {
    const handler = () => getRouteHandler('/conversations/:otherUserId/messages', 'post');

    it('debe devolver 401 si no hay usuario autenticado', async () => {
      req.user = undefined;
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { kind: 'text', payload: { text: 'Hola' } };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('debe devolver 400 si el otherUserId no es válido', async () => {
      req.params = { otherUserId: 'invalid-id' };
      req.body = { kind: 'text', payload: { text: 'Hola' } };
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID de usuario inválido' });
    });

    it('debe devolver 400 si falta kind o payload', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { kind: 'text' }; // Sin payload
      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'kind y payload son requeridos',
      });
    });

    it('debe crear una nueva conversación con un mensaje', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { kind: 'text', payload: { text: 'Hola!' } };

      Conversation.findOne = vi.fn().mockResolvedValue(null);

      let savedConversation: any;
      Conversation.prototype.save = vi.fn().mockImplementation(function (this: any) {
        savedConversation = this;
        return Promise.resolve();
      });

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Mensaje agregado exitosamente',
          data: expect.objectContaining({
            kind: 'text',
            payload: { text: 'Hola!' },
          }),
        })
      );
    });

    it('debe agregar un mensaje a una conversación existente', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { kind: 'text', payload: { text: 'Nuevo mensaje' } };

      const mockConversation = {
        _id: new ObjectId('000000000000000000000003'),
        user1: userId,
        user2: otherUserId,
        messages: [
          { fromUserId: userId, kind: 'text', payload: { text: 'Viejo mensaje' }, createdAt: new Date() },
        ],
        save: vi.fn().mockResolvedValue(undefined),
      };

      Conversation.findOne = vi.fn().mockResolvedValue(mockConversation);

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Mensaje agregado exitosamente',
          data: expect.objectContaining({
            kind: 'text',
            payload: { text: 'Nuevo mensaje' },
          }),
        })
      );
    });

    it('debe manejar errores al guardar un mensaje', async () => {
      req.params = { otherUserId: otherUserId.toString() };
      req.body = { kind: 'text', payload: { text: 'Hola' } };

      Conversation.findOne = vi.fn().mockRejectedValue(new Error('Database error'));

      await handler()!(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error agregando mensaje',
      }));
    });
  });
});
