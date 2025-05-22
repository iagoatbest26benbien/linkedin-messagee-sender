const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const puppeteer = require('puppeteer');
const Store = require('electron-store');

// Configuration du store pour les identifiants
const store = new Store({
  name: 'credentials',
  encryptionKey: 'linkedin-sender-key'
});

let mainWindow;
let messageQueue = [];
let isProcessing = false;
let browser = null;

// Configuration du serveur Express
const server = express();
server.use(express.json());

// Middleware pour la gestion des erreurs
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Endpoint de santé optimisé
server.get('/health', (_, res) => res.json({ status: 'ok' }));

// Endpoint pour les messages optimisé
server.post('/send-message', async (req, res) => {
  try {
    const { profileUrl, message } = req.body;
    if (!profileUrl || !message) {
      return res.status(400).json({ error: 'URL du profil et message requis' });
    }

    const newMessage = {
      profileUrl,
      message,
      status: 'en attente',
      timestamp: Date.now()
    };

    messageQueue.push(newMessage);
    mainWindow?.webContents.send('new-message', newMessage);
    
    if (!isProcessing) {
      processNextMessage();
    }

    res.json({ success: true, message: 'Message ajouté à la file d\'attente' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du message:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du message' });
  }
});

// Fonction optimisée pour traiter les messages
async function processNextMessage() {
  if (messageQueue.length === 0 || isProcessing) return;

  isProcessing = true;
  const message = messageQueue[0];
  const credentials = store.get('credentials');

  try {
    if (!credentials) {
      throw new Error('Identifiants non configurés');
    }

    if (!browser) {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);

    // Connexion optimisée
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });
    await page.type('#username', credentials.email);
    await page.type('#password', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    if (page.url().includes('login')) {
      throw new Error('Échec de la connexion');
    }

    // Envoi du message optimisé
    await page.goto(message.profileUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('button[aria-label*="Message"]', { timeout: 5000 });
    await page.click('button[aria-label*="Message"]');
    await page.waitForSelector('.msg-form__contenteditable', { timeout: 5000 });
    await page.type('.msg-form__contenteditable', message.message);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    message.status = 'envoyé';
    mainWindow?.webContents.send('message-status-update', {
      profileUrl: message.profileUrl,
      status: 'envoyé'
    });

    await page.close();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    message.status = 'erreur';
    message.error = error.message;
    mainWindow?.webContents.send('message-status-update', {
      profileUrl: message.profileUrl,
      status: 'erreur',
      error: error.message
    });
  }

  messageQueue.shift();
  isProcessing = false;
  processNextMessage();
}

// Création de la fenêtre optimisée
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'src/renderer/build/index.html'));
  }
}

// Gestionnaires IPC optimisés
ipcMain.handle('save-credentials', async (_, creds) => {
  try {
    store.set('credentials', creds);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des identifiants:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-credentials', () => {
  return { success: true, credentials: store.get('credentials') };
});

ipcMain.handle('get-message-queue', () => messageQueue);

// Événements de l'application optimisés
app.whenReady().then(() => {
  createWindow();
  server.listen(3000, () => console.log('Serveur démarré sur le port 3000'));
});

app.on('window-all-closed', async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Nettoyage à la fermeture
app.on('before-quit', async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
}); 