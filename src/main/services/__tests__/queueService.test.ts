import { jest } from '@jest/globals';
import { QueueService } from '../queueService';
import { Message, MessageStatus } from '../../../shared/types';
import { LinkedInAuthService } from '../linkedinAuth';
import { LinkedInMessagingService } from '../linkedinMessaging';

describe('QueueService', () => {
  let queueService: QueueService;
  let mockAuthService: jest.Mocked<LinkedInAuthService>;
  let mockMessagingService: jest.Mocked<LinkedInMessagingService>;
  let mockStore: any;
  let mockMessage: Message;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthService = {
      login: jest.fn(),
      isLoggedIn: jest.fn(),
      logout: jest.fn(),
      close: jest.fn(),
      getPage: jest.fn(),
    } as any;

    mockMessagingService = {
      sendMessage: jest.fn(),
      close: jest.fn(),
    } as any;

    mockStore = {
      get: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };

    mockMessage = {
      id: '1',
      recipientUrl: 'https://www.linkedin.com/in/test-user',
      content: 'Hello, this is a test message',
      status: MessageStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    queueService = new QueueService(mockAuthService, mockMessagingService, mockStore);
    (queueService as any).isRunning = false;
  });

  afterEach(async () => {
    await queueService.close();
  });

  describe('addMessage', () => {
    it('should add a new message to the queue', async () => {
      const message = await queueService.addMessage(mockMessage.recipientUrl, mockMessage.content);
      expect(message).toMatchObject({
        recipientUrl: mockMessage.recipientUrl,
        content: mockMessage.content,
        status: MessageStatus.PENDING,
      });
      expect(mockStore.set).toHaveBeenCalledWith('messages', expect.arrayContaining([
        expect.objectContaining({
          recipientUrl: mockMessage.recipientUrl,
          content: mockMessage.content,
        }),
      ]));
    });

    it('should prevent duplicate messages', async () => {
      mockStore.get.mockReturnValueOnce([mockMessage]);
      await expect(queueService.addMessage(mockMessage.recipientUrl, mockMessage.content))
        .rejects.toThrow('Message already exists');
    });
  });

  describe('getMessages', () => {
    it('should return all messages', async () => {
      mockStore.get.mockReturnValueOnce([mockMessage]);
      const messages = await queueService.getMessages();
      expect(messages).toEqual([mockMessage]);
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status', async () => {
      mockStore.get.mockReturnValueOnce([mockMessage]);
      await queueService.updateMessageStatus(mockMessage.id, MessageStatus.SENT);
      expect(mockStore.set).toHaveBeenCalledWith('messages', expect.arrayContaining([
        expect.objectContaining({
          id: mockMessage.id,
          status: MessageStatus.SENT,
        }),
      ]));
    });

    it('should throw error for non-existent message', async () => {
      mockStore.get.mockReturnValueOnce([]);
      await expect(queueService.updateMessageStatus('non-existent', MessageStatus.SENT))
        .rejects.toThrow('Message not found');
    });
  });

  describe('getQueueStatus', () => {
    it('should return current queue status', async () => {
      mockStore.get.mockReturnValueOnce([mockMessage]);
      mockStore.get.mockReturnValueOnce({
        isRunning: true,
        processedCount: 1,
        failedCount: 0,
        lastProcessed: new Date().toISOString(),
      });

      (queueService as any).isRunning = true;
      const status = await queueService.getQueueStatus();
      expect(status).toMatchObject({
        isRunning: true,
        queueLength: 1,
        processedCount: 1,
        failedCount: 0,
      });
    });
  });

  describe('clearQueue', () => {
    it('should clear all messages', async () => {
      await queueService.clearQueue();
      expect(mockStore.set).toHaveBeenCalledWith('messages', []);
      expect(mockStore.set).toHaveBeenCalledWith('status', {
        isRunning: false,
        processedCount: 0,
        failedCount: 0,
        lastProcessed: null,
      });
    });
  });

  describe('startQueue', () => {
    it('should start processing the queue', async () => {
      await queueService.startQueue();
      expect(mockStore.set).toHaveBeenCalledWith('status', {
        isRunning: true,
        processedCount: 0,
        failedCount: 0,
        lastProcessed: null,
      });
    });

    it('should not start if already running', async () => {
      (queueService as any).isRunning = true;
      await queueService.startQueue();
      expect(mockStore.set).not.toHaveBeenCalled();
    });
  });

  describe('stopQueue', () => {
    it('should stop processing the queue', async () => {
      await queueService.stopQueue();
      expect(mockStore.set).toHaveBeenCalledWith('status', {
        isRunning: false,
        processedCount: 0,
        failedCount: 0,
        lastProcessed: null,
      });
    });
  });

  describe('processQueue', () => {
    it('should process pending messages', async () => {
      (queueService as any).isRunning = true;
      mockStore.get.mockReturnValueOnce([mockMessage]);
      mockMessagingService.sendMessage.mockResolvedValueOnce(true);
      await queueService.processQueue();
      expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(mockMessage);
      expect(mockStore.set).toHaveBeenCalledWith('status', expect.objectContaining({
        processedCount: 1,
      }));
    });

    it('should handle message sending failures', async () => {
      (queueService as any).isRunning = true;
      mockStore.get.mockReturnValueOnce([mockMessage]);
      mockMessagingService.sendMessage.mockResolvedValueOnce(false);
      await queueService.processQueue();
      expect(mockStore.set).toHaveBeenCalledWith('messages', expect.arrayContaining([
        expect.objectContaining({
          status: MessageStatus.FAILED,
        }),
      ]));
      expect(mockStore.set).toHaveBeenCalledWith('status', expect.objectContaining({
        failedCount: 1,
      }));
    });
  });

  describe('close', () => {
    it('should close the messaging service', async () => {
      await queueService.close();
      expect(mockMessagingService.close).toHaveBeenCalled();
    });
  });
}); 