import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Hoisted mocks to be available before importing the router
const mocks = vi.hoisted(() => {
	// mongoose session mock
	const session = {
		startTransaction: vi.fn(),
		commitTransaction: vi.fn(),
		abortTransaction: vi.fn(),
		endSession: vi.fn(),
	};

	// Minimal mongoose Types.ObjectId mock
	class MockObjectId {
		toHexString() {
			return 'hex123';
		}
	}

	// Conversation model mock
	const Conversation = {
		findById: vi.fn(),
	} as any;

	// Card model constructors with static methods used by the router
	function PokemonCard(this: any, data: any) {
		Object.assign(this, data);
	}
	PokemonCard.findById = vi.fn();
	PokemonCard.updateOne = vi.fn();

	function TrainerCard(this: any, data: any) {
		Object.assign(this, data);
	}
	TrainerCard.findById = vi.fn();
	TrainerCard.updateOne = vi.fn();

	function EnergyCard(this: any, data: any) {
		Object.assign(this, data);
	}
	EnergyCard.findById = vi.fn();
	EnergyCard.updateOne = vi.fn();

	// Trade model mock (constructor + save on prototype)
	function Trade(this: any, data: any) {
		Object.assign(this, data);
	}
	Trade.prototype.save = vi.fn();

	return { session, MockObjectId, Conversation, PokemonCard, TrainerCard, EnergyCard, Trade };
});

vi.mock('mongoose', () => ({
	default: {
		startSession: vi.fn(async () => mocks.session),
		Types: { ObjectId: mocks.MockObjectId },
	},
	// named import compatibility
	startSession: vi.fn(async () => mocks.session),
	Types: { ObjectId: mocks.MockObjectId },
}));

vi.mock('../../../src/app/models/conversationModel', () => ({
	Conversation: mocks.Conversation,
}));

vi.mock('../../../src/app/models/cards/pokemonCardModel', () => ({
	PokemonCard: mocks.PokemonCard,
}));

vi.mock('../../../src/app/models/cards/trainerCardModel', () => ({
	TrainerCard: mocks.TrainerCard,
}));

vi.mock('../../../src/app/models/cards/energyCardModel', () => ({
	EnergyCard: mocks.EnergyCard,
}));

vi.mock('../../../src/app/models/tradeModel', () => ({
	Trade: mocks.Trade,
}));

import router from '../../../src/app/routers/executeTradeRouter';

function getRouteHandler(path: string, method = 'post') {
	// @ts-ignore - access express internals for testing
	const stack = (router as any).stack as any[];
	for (const layer of stack) {
		if (!layer.route) continue;
		if (layer.route.path === path && layer.route.methods[method]) {
			const routeStack = layer.route.stack;
			return routeStack[routeStack.length - 1].handle;
		}
	}
	throw new Error(`Handler not found: ${path} (${method})`);
}

describe('executeTradeRouter POST /', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;

	const handler = () => getRouteHandler('/','post');

	beforeEach(() => {
		vi.clearAllMocks();
		req = { body: {} };
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any;
	});

	it('debe devolver 400 si falta conversationId', async () => {
		await handler()!(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'conversationId requerido' });
	});

	it('debe devolver 400 si la propuesta no está aceptada por ambas partes', async () => {
		// Conversation mock with unaccepted proposal
		const conversationDoc = {
			lastTradeProposal: {
				proposal: {
					proposer: { userId: 'userA', accepted: true, cards: [] },
					receiver: { userId: 'userB', accepted: false, cards: [] },
				},
			},
			messages: [],
			save: vi.fn(),
		};
		mocks.Conversation.findById.mockReturnValue({
			session: () => conversationDoc,
		});

		req.body = { conversationId: 'conv1' };
		await handler()!(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'El intercambio no ha sido aceptado por ambas partes' });
	});

	it('debe devolver 400 si alguna carta no es intercambiable', async () => {
		const proposerCardId = 'cardA';
		const receiverCardId = 'cardB';
		const conversationDoc = {
			lastTradeProposal: {
				proposal: {
					proposer: { userId: 'userA', accepted: true, cards: [{ cardType: 'PokemonCard', cardId: proposerCardId }] },
					receiver: { userId: 'userB', accepted: true, cards: [{ cardType: 'PokemonCard', cardId: receiverCardId }] },
				},
			},
			messages: [],
			save: vi.fn(),
		};
		mocks.Conversation.findById.mockReturnValue({ session: () => conversationDoc });

		// First validation phase uses .findById().session(session)
		mocks.PokemonCard.findById.mockImplementation((id: string) => ({
			session: () => {
				if (id === proposerCardId) {
					return { _id: 'locA', id: 'apiA', name: 'Pikachu', image: 'imgA', isTradable: false, owner: { equals: (u: string) => u === 'userA' } };
				}
				if (id === receiverCardId) {
					return { _id: 'locB', id: 'apiB', name: 'Charmander', image: 'imgB', isTradable: true, owner: { equals: (u: string) => u === 'userB' } };
				}
				return null;
			}
		}));

		req.body = { conversationId: 'conv2' };
		await handler()!(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Carta no intercambiable: Pikachu' });
	});

	it('debe devolver 400 si el owner de una carta no coincide', async () => {
		const proposerCardId = 'cardA';
		const conversationDoc = {
			lastTradeProposal: {
				proposal: {
					proposer: { userId: 'userA', accepted: true, cards: [{ cardType: 'PokemonCard', cardId: proposerCardId }] },
					receiver: { userId: 'userB', accepted: true, cards: [] },
				},
			},
			messages: [],
			save: vi.fn(),
		};
		mocks.Conversation.findById.mockReturnValue({ session: () => conversationDoc });

		mocks.PokemonCard.findById.mockImplementation((id: string) => ({
			session: () => ({ _id: 'locA', id: 'apiA', name: 'Pikachu', image: 'imgA', isTradable: true, owner: { equals: () => false } })
		}));

		req.body = { conversationId: 'conv3' };
		await handler()!(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Owner incorrecto para carta: Pikachu' });
	});

	it('debe ejecutar el intercambio exitosamente', async () => {
		const proposerCardId = 'cardA';
		const receiverCardId = 'cardB';

		// Conversation document with proposal
		const conversationDoc: any = {
			lastTradeProposal: {
				proposal: {
					proposer: { userId: 'userA', accepted: true, cards: [{ cardType: 'PokemonCard', cardId: proposerCardId }] },
					receiver: { userId: 'userB', accepted: true, cards: [{ cardType: 'PokemonCard', cardId: receiverCardId }] },
				},
			},
			messages: [],
			isLocked: false,
			lockedReason: undefined,
			save: vi.fn(),
		};
		mocks.Conversation.findById.mockReturnValue({ session: () => conversationDoc });

		// Card lookups for validation + item details
		const cardMap: Record<string, any> = {
			[proposerCardId]: { _id: { toString: () => 'locA' }, id: 'apiA', name: 'Pikachu', image: 'imgA', isTradable: true, owner: { equals: (u: string) => u === 'userA' } },
			[receiverCardId]: { _id: { toString: () => 'locB' }, id: 'apiB', name: 'Charmander', image: 'imgB', isTradable: true, owner: { equals: (u: string) => u === 'userB' } },
		};
		mocks.PokemonCard.findById.mockImplementation((id: string) => ({
			session: () => cardMap[id],
		}));
		mocks.PokemonCard.updateOne.mockResolvedValue({});

		// Trade save resolves
		(mocks.Trade as any).prototype.save.mockResolvedValue({});

		req.body = { conversationId: 'conv4' };
		await handler()!(req as Request, res as Response);

		// Response assertions
		expect(res.status).toHaveBeenCalledWith(201);
		const jsonArg = (res.json as any).mock.calls[0][0];
		expect(jsonArg).toEqual(
			expect.objectContaining({
				message: 'Intercambio realizado correctamente',
				tradeId: expect.any(String),
				trade: expect.objectContaining({ status: expect.anything() }),
			})
		);

		// Side-effects assertions
		expect(mocks.PokemonCard.updateOne).toHaveBeenCalledTimes(2);
		expect(conversationDoc.save).toHaveBeenCalled();
	});
});

