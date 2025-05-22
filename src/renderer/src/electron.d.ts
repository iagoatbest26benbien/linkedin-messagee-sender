import { IpcResponse, LinkedInCredentials, Message, QueueStatus } from '../../shared/types';

declare global {
  interface Window {
    electron: {
      // Gestion des identifiants
      saveCredentials: (credentials: LinkedInCredentials) => Promise<IpcResponse<void>>;
      getCredentials: () => Promise<IpcResponse<LinkedInCredentials>>;

      // Gestion des messages
      addMessage: (recipientUrl: string, content: string) => Promise<IpcResponse<Message>>;
      getMessages: () => Promise<IpcResponse<Message[]>>;

      // Gestion de la file d'attente
      startQueue: () => Promise<IpcResponse<void>>;
      stopQueue: () => Promise<IpcResponse<void>>;
      getQueueStatus: () => Promise<IpcResponse<QueueStatus>>;
    };
  }
} 