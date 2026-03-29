// Since uuid v13 is an ESM module and hard to mock with CommonJS Jest,
// we test the generateId function by verifying its behavior
describe('UUID Utils', () => {
  // We need to require fresh module to avoid cache issues
  let generateId;

  beforeAll(() => {
    // Clear module cache to ensure fresh import
    jest.resetModules();
    const uuidModule = require('../../src/utils/uuid');
    generateId = uuidModule.generateId;
  });

  describe('generateId', () => {
    it('should generate a valid string ID', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate an ID without prefix that looks like UUID', () => {
      const id = generateId();
      // UUID v4 without dashes is 32 hex characters
      expect(id.length).toBe(32);
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate a UUID with prefix', () => {
      const id = generateId('user');
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.startsWith('user_')).toBe(true);
      // Should be prefix_ + 32 char uuid
      expect(id.length).toBe(5 + 32);
    });

    it('should generate different IDs on each call', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(generateId());
      }
      // With actual uuid, all 10 should be unique
      expect(ids.size).toBe(10);
    });

    it('should generate IDs with different prefixes that are unique', () => {
      const id1 = generateId('user');
      const id2 = generateId('event');
      const id3 = generateId('msg');

      expect(id1.startsWith('user_')).toBe(true);
      expect(id2.startsWith('event_')).toBe(true);
      expect(id3.startsWith('msg_')).toBe(true);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });
  });
});
