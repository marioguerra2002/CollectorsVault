import { describe, it, expect, vi } from 'vitest';
// Mock de TCGdex para que no intente instanciar la clase real
vi.mock('@tcgdex/sdk', () => {
  return {
    default: class {
      constructor() {}
    },
  };
});
// Ahora podemos importar utils.ts sin que falle al instanciar TCGdex
import { dataclassToDict, mapRarityFromTCGdex } from '../../../src/app/utils/utils';
import { TypeCardRarity } from '../../../src/app/enums/typeCardRarity';
describe('utils.ts', () => {
  describe('dataclassToDict', () => {
    it('convierte objetos anidados en diccionarios recursivamente', () => {
      const input = {
        a: 1,
        b: 'text',
        c: {
          d: 2,
          e: [3, 4, { f: 5 }],
        },
        sdk: 'should be ignored',
      };
      const expected = {
        a: 1,
        b: 'text',
        c: {
          d: 2,
          e: [3, 4, { f: 5 }],
        },
      };
      expect(dataclassToDict(input)).toEqual(expected);
    });
    it('devuelve el valor directamente si no es objeto ni array', () => {
      expect(dataclassToDict(42)).toBe(42);
      expect(dataclassToDict('hello')).toBe('hello');
      expect(dataclassToDict(null)).toBeNull();
    });
  });
  describe('mapRarityFromTCGdex', () => {
    it('mapea rarezas conocidas correctamente', () => {
      expect(mapRarityFromTCGdex('Common')).toBe(TypeCardRarity.COMMON);
      expect(mapRarityFromTCGdex('Ultra Rare')).toBe(TypeCardRarity.RARE_ULTRA);
      expect(mapRarityFromTCGdex('Hyper Rare')).toBe(TypeCardRarity.RARE_HIPER);
      expect(mapRarityFromTCGdex('Special Illustration Rare')).toBe(TypeCardRarity.RARE_SPECIAL_ILUSTRATION);
    });
    it('normaliza strings con espacios y mayúsculas', () => {
      expect(mapRarityFromTCGdex('  ultra rare  ')).toBe(TypeCardRarity.RARE_ULTRA);
      expect(mapRarityFromTCGdex('RARE ILLUSTRATION')).toBe(TypeCardRarity.RARE_ILUSTRATION);
    });
    it('devuelve COMMON si no se proporciona valor', () => {
      expect(mapRarityFromTCGdex(undefined)).toBe(TypeCardRarity.COMMON);
      expect(mapRarityFromTCGdex('')).toBe(TypeCardRarity.COMMON);
    });
    it('devuelve el valor original si no hay mapeo', () => {
      expect(mapRarityFromTCGdex('Custom Rare')).toBe('Custom Rare');
    });
  });
});
