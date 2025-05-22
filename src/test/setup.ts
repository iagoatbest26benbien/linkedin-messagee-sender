import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Mock de l'application Electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockImplementation((name) => {
      if (name === 'userData') {
        return path.join(__dirname, 'test-user-data');
      }
      return path.join(__dirname, 'test-data', name);
    }),
  },
}));

// Configuration globale pour les tests
beforeAll(() => {
  // Nettoyer les données de test avant de commencer
  const testDataDir = path.join(__dirname, 'test-data');
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDataDir, { recursive: true });
});

afterAll(() => {
  // Nettoyer les données de test après avoir terminé
  const testDataDir = path.join(__dirname, 'test-data');
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
});

// Configuration pour chaque test
beforeEach(() => {
  // Réinitialiser les mocks
  jest.clearAllMocks();
});

// Configuration pour les timeouts
jest.setTimeout(10000);

// Configuration pour les erreurs non gérées
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Configuration pour les avertissements
process.on('warning', (warning) => {
  console.warn('Warning:', warning);
}); 