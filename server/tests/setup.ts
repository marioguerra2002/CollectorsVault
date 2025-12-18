import { vi } from "vitest";

// Mock server before any imports to prevent circular dependency
vi.mock("../src/server", () => ({
  io: {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  },
}));

vi.mock("tcgdex", () => {
  return {
    TCGdex: vi.fn(() => ({
      getCard: vi.fn(),
      getSet: vi.fn(),
    })),
    ILanguage: { EN: "en" },
  };
});
