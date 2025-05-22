const { contextBridge, ipcRenderer } = require('electron');

// Liste des canaux IPC autorisés
const validChannels = {
  invoke: ['save-credentials', 'get-credentials', 'get-message-queue'],
  on: ['new-message', 'message-status-update']
};

// Vérification de sécurité pour les canaux IPC
const validateChannel = (channel, type) => {
  if (!validChannels[type]?.includes(channel)) {
    throw new Error(`Canal IPC non autorisé: ${channel}`);
  }
};

// Exposition sécurisée des API
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, data) => {
    validateChannel(channel, 'invoke');
    return ipcRenderer.invoke(channel, data);
  },
  on: (channel, func) => {
    validateChannel(channel, 'on');
    const subscription = (_, ...args) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  }
}); 