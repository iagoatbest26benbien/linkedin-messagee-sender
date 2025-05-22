import { Message, MessageStatus, QueueStatus } from '../../shared/types';
import { logger } from '../utils/logger';
import { LinkedInAuthService } from './linkedinAuth';
import { LinkedInMessagingService } from './linkedinMessaging';

export class QueueService {
  private isRunning: boolean = false;
  private store: any;
  private authService: LinkedInAuthService;
  private messagingService: LinkedInMessagingService;

  constructor(authService: LinkedInAuthService, messagingService: LinkedInMessagingService, store: any) {
    this.authService = authService;
    this.messagingService = messagingService;
    this.store = store;
  }

  async addMessage(recipientUrl: string, content: string): Promise<Message> {
    const messages = this.store.get('messages') || [];
    
    // Vérifier si le message existe déjà
    if (messages.some((msg: Message) => msg.recipientUrl === recipientUrl)) {
      throw new Error('Message already exists');
    }

    const message: Message = {
      id: Date.now().toString(),
      recipientUrl,
      content,
      status: MessageStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    messages.push(message);
    this.store.set('messages', messages);
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return this.store.get('messages') || [];
  }

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const messages = this.store.get('messages') || [];
    const messageIndex = messages.findIndex((msg: Message) => msg.id === messageId);
    
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    messages[messageIndex] = {
      ...messages[messageIndex],
      status,
      updatedAt: new Date().toISOString(),
    };

    this.store.set('messages', messages);
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const messages = this.store.get('messages') || [];
    const status = this.store.get('status') || {
      isRunning: false,
      processedCount: 0,
      failedCount: 0,
      lastProcessed: null,
    };

    return {
      isRunning: this.isRunning,
      queueLength: messages.length,
      processedCount: status.processedCount,
      failedCount: status.failedCount,
      lastProcessed: status.lastProcessed,
    };
  }

  async clearQueue(): Promise<void> {
    this.store.set('messages', []);
    this.store.set('status', {
      isRunning: false,
      processedCount: 0,
      failedCount: 0,
      lastProcessed: null,
    });
  }

  async startQueue(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.store.set('status', {
      isRunning: true,
      processedCount: 0,
      failedCount: 0,
      lastProcessed: null,
    });

    await this.processQueue();
  }

  async stopQueue(): Promise<void> {
    this.isRunning = false;
    this.store.set('status', {
      isRunning: false,
      processedCount: 0,
      failedCount: 0,
      lastProcessed: null,
    });
  }

  async processQueue(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const messages = this.store.get('messages') || [];
    const pendingMessages = messages.filter((msg: Message) => msg.status === MessageStatus.PENDING);

    for (const message of pendingMessages) {
      try {
        const success = await this.messagingService.sendMessage(message);
        if (success) {
          await this.updateMessageStatus(message.id, MessageStatus.SENT);
          const status = this.store.get('status');
          this.store.set('status', {
            ...status,
            processedCount: (status.processedCount || 0) + 1,
            lastProcessed: new Date().toISOString(),
          });
        } else {
          await this.updateMessageStatus(message.id, MessageStatus.FAILED);
          const status = this.store.get('status');
          this.store.set('status', {
            ...status,
            failedCount: (status.failedCount || 0) + 1,
          });
        }
      } catch (error) {
        logger.error('Error processing message:', error);
        await this.updateMessageStatus(message.id, MessageStatus.FAILED);
        const status = this.store.get('status');
        this.store.set('status', {
          ...status,
          failedCount: (status.failedCount || 0) + 1,
        });
      }
    }

    if (this.isRunning) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async close(): Promise<void> {
    await this.messagingService.close();
  }
} 