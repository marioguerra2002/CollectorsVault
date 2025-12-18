import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Hoisted mocks to apply before importing the router
const mocks = vi.hoisted(() => {
	class MockObjectId {
		toHexString() {
			return 'hex-trade-id';
		}
	}
	function Trade(this: any, data: any) {
		Object.assign(this, data);
	}
	Trade.prototype.save = vi.fn();
	return { MockObjectId, Trade };
});

vi.mock('mongoose', () => ({
	default: {
		Types: { ObjectId: mocks.MockObjectId },
	},
	Types: { ObjectId: mocks.MockObjectId },
}));

vi.mock('../../../src/app/models/tradeModel', () => ({
	Trade: mocks.Trade,
}));

import { tradeRouter } from '../../../src/app/routers/tradeRouter';

function getRouteHandler(path: string, method = 'post') {
	// @ts-ignore - access express internals for testing
	const stack = (tradeRouter as any).stack as any[];
	for (const layer of stack) {
		if (!layer.route) continue;
		if (layer.route.path === path && layer.route.methods[method]) {
			const routeStack = layer.route.stack;
			return routeStack[routeStack.length - 1].handle;
		}
	}
	throw new Error(`Handler not found: ${path} (${method})`);
}

describe('tradeRouter - POST /trades', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	const handler = () => getRouteHandler('/trades', 'post');

	beforeEach(() => {
		vi.clearAllMocks();
		req = { body: {} };
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any;
	});

	it('debe devolver 400 si faltan campos requeridos', async () => {
		req.body = {};
		await handler()!(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
	});

	it('debe devolver 400 si alguno de los usuarios no ofrece cartas', async () => {
		req.body = {
			user1: 'u1',
			user2: 'u2',
			user1Items: [],
			user2Items: [{ id: 'c2' }],
		} as any;
		await handler()!(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Both users must offer at least one item for trade' });
	});

	it('debe devolver 400 si ambos usuarios proponen la misma carta', async () => {
		req.body = {
			user1: 'u1',
			user2: 'u2',
			user1Items: [{ id: 'same' }],
			user2Items: [{ id: 'same' }],
		} as any;
		await handler()!(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Users cannot trade the same card' });
	});

	it('debe crear un intercambio cuando los datos son válidos', async () => {
		const user1 = 'user-1';
		const user2 = 'user-2';

		// Arrays con ids distintos y con propiedad auxiliar `.collection` para pasar la validación actual del router
		const user1Items: any[] = [{ id: 'c1' }];
		const user2Items: any[] = [{ id: 'c2' }];
		// Adjuntar propiedades para evitar fallos por acceso a `.collection`
		(user1Items as any).collection = ['z'];
		(user2Items as any).collection = ['y'];

		const savedTrade = {
			id: 'hex-trade-id',
			user1,
			user2,
			user1NewCards: user2Items,
			user2NewCards: user1Items,
			user1AproxValue: 0,
			user2AproxValue: 0,
			status: 'PENDING',
		} as any;

		(mocks.Trade as any).prototype.save.mockResolvedValueOnce(savedTrade);

		req.body = { user1, user2, user1Items, user2Items } as any;

		await handler()!(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(201);
		// el body debe ser el retorno de save()
		expect(res.json).toHaveBeenCalledWith(savedTrade);
		// asegúrate que se llamó a save en la instancia
		expect((mocks.Trade as any).prototype.save).toHaveBeenCalled();
	});
});

