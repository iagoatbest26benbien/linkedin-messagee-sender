import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { LinkedInAuthService } from './services/linkedinAuth';
import { QueueService } from './services/queueService';
import { logger } from './utils/logger';

let mainWindow: BrowserWindow | null = null;
let authService: LinkedInAuthService | null = null;
let queueService: QueueService | null = null;

async function createWindow() {
  try {
    logger.info('Création de la fenêtre principale...');

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Charger l'application React
    if (process.env.NODE_ENV === 'development') {
      await mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    logger.info('Fenêtre principale créée avec succès');
  } catch (error) {
    logger.error('Erreur lors de la création de la fenêtre:', error);
    throw error;
  }
}

async function initializeServices() {
  try {
    logger.info('Initialisation des services...');

    authService = new LinkedInAuthService();
    queueService = new QueueService();

    logger.info('Services initialisés avec succès');
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation des services:', error);
    throw error;
  }
}

function setupIpcHandlers() {
  // Gestion des identifiants
  ipcMain.handle('get-credentials', async () => {
    try {
      const store = new (require('electron-store'))({
        name: 'credentials',
        encryptionKey: process.env.STORE_ENCRYPTION_KEY || 'default-key-change-me',
      });
      return store.get('credentials');
    } catch (error) {
      logger.error('Erreur lors de la récupération des identifiants:', error);
      throw error;
    }
  });

  ipcMain.handle('save-credentials', async (_, credentials) => {
    try {
      const store = new (require('electron-store'))({
        name: 'credentials',
        encryptionKey: process.env.STORE_ENCRYPTION_KEY || 'default-key-change-me',
      });
      await store.set('credentials', credentials);
      return credentials;
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des identifiants:', error);
      throw error;
    }
  });

  // Gestion de la file d'attente
  ipcMain.handle('get-messages', async () => {
    try {
      return await queueService?.getMessages();
    } catch (error) {
      logger.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  });

  ipcMain.handle('add-message', async (_, message) => {
    try {
      return await queueService?.addMessage(message);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du message:', error);
      throw error;
    }
  });

  ipcMain.handle('clear-queue', async () => {
    try {
      await queueService?.clearQueue();
    } catch (error) {
      logger.error('Erreur lors du vidage de la file d\'attente:', error);
      throw error;
    }
  });

  ipcMain.handle('start-queue', async () => {
    try {
      await queueService?.startQueue();
    } catch (error) {
      logger.error('Erreur lors du démarrage de la file d\'attente:', error);
      throw error;
    }
  });

  ipcMain.handle('stop-queue', async () => {
    try {
      await queueService?.stopQueue();
    } catch (error) {
      logger.error('Erreur lors de l\'arrêt de la file d\'attente:', error);
      throw error;
    }
  });

  ipcMain.handle('get-queue-status', async () => {
    try {
      return await queueService?.getQueueStatus();
    } catch (error) {
      logger.error('Erreur lors de la récupération du statut:', error);
      throw error;
    }
  });
}

app.whenReady().then(async () => {
  try {
    await createWindow();
    await initializeServices();
    setupIpcHandlers();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    logger.error('Erreur lors du démarrage de l\'application:', error);
    app.quit();
  }
});

app.on('window-all-closed', async () => {
  try {
    logger.info('Fermeture de l\'application...');

    if (authService) {
      await authService.close();
    }

    if (queueService) {
      await queueService.close();
    }

    if (process.platform !== 'darwin') {
      app.quit();
    }
  } catch (error) {
    logger.error('Erreur lors de la fermeture de l\'application:', error);
    app.quit();
  }
}); 