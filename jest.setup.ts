// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Polyfill for fetch

// Mock TextEncoder & TextDecoder which are used by genkit but not available in JSDOM
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto.randomUUID
if (!crypto.randomUUID) {
  Object.defineProperty(global.self, 'crypto', {
    value: {
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
    },
  });
}
