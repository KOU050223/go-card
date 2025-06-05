/**
 * Test setup file for Vitest
 * Configures testing environment and global utilities
 */
import '@testing-library/jest-dom';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_BACKEND_WS: 'ws://localhost:8080/ws',
    VITE_DEV_MODE: 'true',
  },
});

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url: string) {
    console.log('Mock WebSocket created:', url);
  }
  
  close() {}
  send() {}
  
  // Event handlers
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;
  
  readyState = 1; // OPEN
} as any;

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  googleProvider: {},
}));
