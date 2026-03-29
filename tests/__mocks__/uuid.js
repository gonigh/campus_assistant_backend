// Mock UUID module for testing
let counter = 0;

module.exports = {
  v4: () => {
    counter++;
    // Return a mock UUID v4 format (32 hex characters without dashes)
    const hex = counter.toString(16).padStart(8, '0') +
                '1234567890abcdef'.repeat(2).slice(0, 24);
    return hex;
  }
};
