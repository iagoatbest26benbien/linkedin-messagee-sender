import { Message, MessageStatus, QueueStatus } from '../../shared/types';
import { linkedInService } from './linkedin';

class QueueService {
  private messages: Message[] = [];
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  async addMessage(recipientUrl: string, content: string): Promise<Message> {
    const message: Message = {
      id: Date.now().toString(),
      recipientUrl,
      content,
      status: MessageStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.messages.push(message);
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return this.messages;
  }

  async getNextMessage(): Promise<Message | null> {
    return this.messages.find(m => m.status === MessageStatus.PENDING) || null;
  }

  async updateMessageStatus(messageId: string, status: MessageStatus, error?: string): Promise<void> {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      message.updatedAt = new Date().toISOString();
      if (error) {
        message.error = error;
      }
    }
  }

  async start() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processNextMessage();
    }, 5000); // Délai de 5 secondes entre chaque message
  }

  async stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }

  async getStatus(): Promise<QueueStatus> {
    return {
      isRunning: this.isProcessing,
      queueLength: this.messages.filter(m => m.status === MessageStatus.PENDING).length,
      processedCount: this.messages.filter(m => m.status === MessageStatus.SENT).length,
      failedCount: this.messages.filter(m => m.status === MessageStatus.FAILED).length
    };
  }

  private async processNextMessage() {
    const pendingMessage = await this.getNextMessage();
    if (!pendingMessage) return;

    try {
      // Mettre à jour le statut du message
      await this.updateMessageStatus(pendingMessage.id, MessageStatus.SENDING);

      // Envoyer le message
      await linkedInService.sendMessage(pendingMessage);

      // Mettre à jour le statut en cas de succès
      await this.updateMessageStatus(pendingMessage.id, MessageStatus.SENT);
    } catch (error) {
      // Mettre à jour le statut en cas d'échec
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      await this.updateMessageStatus(pendingMessage.id, MessageStatus.FAILED, errorMessage);
    }
  }
}

export const queueService = new QueueService(); 