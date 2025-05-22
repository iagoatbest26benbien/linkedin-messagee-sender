import { contextBridge, ipcRenderer } from 'electron';
import { ApiResponse, LinkedInCredentials, Message, QueueStatus } from '../shared/types';

// Expose les API Electron au renderer de manière sécurisée
contextBridge.exposeInMainWorld('electron', {
  // Gestion des identifiants
  getCredentials: (): Promise<ApiResponse<LinkedInCredentials>> => 
    ipcRenderer.invoke('get-credentials'),
  
  saveCredentials: (credentials: LinkedInCredentials): Promise<ApiResponse<void>> => 
    ipcRenderer.invoke('save-credentials', credentials),

  // Gestion des messages
  addMessage: (recipientUrl: string, content: string): Promise<ApiResponse<Message>> => 
    ipcRenderer.invoke('add-message', { recipientUrl, content }),
  
  getMessages: (): Promise<ApiResponse<Message[]>> => 
    ipcRenderer.invoke('get-messages'),

  // Gestion de la file d'attente
  startQueue: (): Promise<ApiResponse<void>> => 
    ipcRenderer.invoke('start-queue'),
  
  stopQueue: (): Promise<ApiResponse<void>> => 
    ipcRenderer.invoke('stop-queue'),
  
  getQueueStatus: (): Promise<ApiResponse<QueueStatus>> => 
    ipcRenderer.invoke('get-queue-status'),

  // Événements
  onQueueStatusChange: (callback: (status: QueueStatus) => void) => {
    ipcRenderer.on('queue-status-change', (_, status) => callback(status));
    return () => {
      ipcRenderer.removeAllListeners('queue-status-change');
    };
  },

  onMessageStatusChange: (callback: (message: Message) => void) => {
    ipcRenderer.on('message-status-change', (_, message) => callback(message));
    return () => {
      ipcRenderer.removeAllListeners('message-status-change');
    };
  }
}); 