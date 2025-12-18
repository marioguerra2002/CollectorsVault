import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Mock de mongoose antes de importar connectDB
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));
// Mock de dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));
// Importar después de los mocks
import mongoose from 'mongoose';
import connectDB from '../../../../src/app/lib/db/connectDB';
describe('connectDB', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  beforeEach(() => {
    // Guardar estado original
    originalEnv = { ...process.env };
    // Espías para console y process.exit
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit: ${code}`);
    });
    vi.clearAllMocks();
  });
  afterEach(() => {
    // Restaurar estado
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
  it('debería lanzar error si MONGODB_URI no está definida', async () => {
    // Eliminar la variable de entorno
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow(
      'MONGODB_URI no está definida en las variables de entorno'
    );
  });
  it('debería conectar exitosamente con MONGODB_URI válida', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    // Mock de conexión exitosa
    (mongoose.connect as any).mockResolvedValue(undefined);
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Conexión a MongoDB establecida exitosamente.'
    );
  });
  it('debería manejar errores de conexión y llamar process.exit(1)', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const mockError = new Error('Error de conexión');
    // Mock de conexión fallida
    (mongoose.connect as any).mockRejectedValue(mockError);
    // Esperar que lance el error de process.exit
    await expect(connectDB()).rejects.toThrow('process.exit: 1');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al conectar a MongoDB:',
      mockError
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
