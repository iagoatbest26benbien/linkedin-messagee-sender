import { ipcMain } from 'electron';
import { ApiResponse, LinkedInCredentials, Message, MessageStatus, QueueStatus } from '../../shared/types';
import { linkedInService } from '../services/linkedin';
import { queueService } from '../services/queue';

export function setupIpcHandlers() {
  // Gestion des identifiants
  ipcMain.handle('get-credentials', async (): Promise<ApiResponse<LinkedInCredentials>> => {
    try {
      const credentials = await linkedInService.getCredentials();
      return { success: true, data: credentials };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération des identifiants' };
    }
  });

  ipcMain.handle('save-credentials', async (_, credentials: LinkedInCredentials): Promise<ApiResponse<void>> => {
    try {
      await linkedInService.saveCredentials(credentials);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la sauvegarde des identifiants' };
    }
  });

  // Gestion des messages
  ipcMain.handle('add-message', async (_, { recipientUrl, content }: { recipientUrl: string; content: string }): Promise<ApiResponse<Message>> => {
    try {
      const message = await queueService.addMessage(recipientUrl, content);
      return { success: true, data: message };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'ajout du message' };
    }
  });

  ipcMain.handle('get-messages', async (): Promise<ApiResponse<Message[]>> => {
    try {
      const messages = await queueService.getMessages();
      return { success: true, data: messages };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération des messages' };
    }
  });

  // Gestion de la file d'attente
  ipcMain.handle('start-queue', async (): Promise<ApiResponse<void>> => {
    try {
      await queueService.start();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur lors du démarrage de la file d\'attente' };
    }
  });

  ipcMain.handle('stop-queue', async (): Promise<ApiResponse<void>> => {
    try {
      await queueService.stop();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'arrêt de la file d\'attente' };
    }
  });

  ipcMain.handle('get-queue-status', async (): Promise<ApiResponse<QueueStatus>> => {
    try {
      const status = await queueService.getStatus();
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération du statut' };
    }
  });
}

// Fonction pour traiter les messages en attente
export async function processQueue(): Promise<void> {
  if (!queueService.getStatus().isRunning) return;

  const message = await queueService.getNextMessage();
  if (!message) return;

  try {
    await queueService.updateMessageStatus(message.id, MessageStatus.SENDING);
    const success = await linkedInService.sendMessage(message.recipientUrl, message.content);
    
    if (success) {
      await queueService.updateMessageStatus(message.id, MessageStatus.SENT);
    } else {
      await queueService.updateMessageStatus(message.id, MessageStatus.FAILED, 'Failed to send message');
    }
  } catch (error) {
    await queueService.updateMessageStatus(message.id, MessageStatus.FAILED, error.message);
  }

  // Traiter le prochain message après un délai
  setTimeout(processQueue, 5000);
} 