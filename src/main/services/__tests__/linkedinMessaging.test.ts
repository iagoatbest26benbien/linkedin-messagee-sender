import { jest } from '@jest/globals';
import { LinkedInMessagingService } from '../linkedinMessaging';
import { Message, MessageStatus } from '../../../shared/types';
import { createBrowser } from '../../utils/browser';
import { logger } from '../../utils/logger';

// Mock des dépendances
jest.mock('../../utils/browser');
jest.mock('../../utils/logger');

describe('LinkedInMessagingService', () => {
  let messagingService: LinkedInMessagingService;
  let mockBrowser: any;
  let mockPage: any;

  const mockMessage: Message = {
    id: '1',
    recipientUrl: 'https://www.linkedin.com/in/test-user',
    content: 'Hello, this is a test message',
    status: MessageStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(true),
      type: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue(true),
      setExtraHTTPHeaders: jest.fn().mockResolvedValue(undefined),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      setDefaultNavigationTimeout: jest.fn().mockResolvedValue(undefined),
      setDefaultTimeout: jest.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (createBrowser as jest.Mock).mockResolvedValue(mockBrowser);

    messagingService = new LinkedInMessagingService();
    (messagingService as any).page = mockPage;
    (messagingService as any).browser = mockBrowser;
  });

  afterEach(async () => {
    await messagingService.close();
  });

  describe('sendMessage', () => {
    it('should successfully send a message', async () => {
      mockPage.evaluate.mockResolvedValue(true);
      mockPage.waitForSelector.mockResolvedValue(true);
      mockPage.click.mockResolvedValue(undefined);
      mockPage.type.mockResolvedValue(undefined);
      mockPage.setExtraHTTPHeaders.mockResolvedValue(undefined);
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0 as any; });

      const result = await messagingService.sendMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockPage.goto).toHaveBeenCalledWith(mockMessage.recipientUrl, expect.any(Object));
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('button[aria-label="Message"]', expect.any(Object));
      expect(mockPage.click).toHaveBeenCalledWith('button[aria-label="Message"]');
      expect(mockPage.type).toHaveBeenCalled();
    }, 30000);

    it('should handle message button not clickable', async () => {
      mockPage.evaluate.mockResolvedValue(false);
      mockPage.waitForSelector.mockResolvedValue(true);
      await expect(messagingService.sendMessage(mockMessage))
        .rejects.toThrow('Échec de l\'envoi du message après plusieurs tentatives');
    }, 30000);

    it('should handle network errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Network error'));
      await expect(messagingService.sendMessage(mockMessage))
        .rejects.toThrow('Échec de l\'envoi du message après plusieurs tentatives');
    }, 30000);

    it('should retry on failure', async () => {
      mockPage.evaluate
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(true);
      mockPage.waitForSelector.mockResolvedValue(true);
      mockPage.click.mockResolvedValue(undefined);
      mockPage.type.mockResolvedValue(undefined);
      mockPage.setExtraHTTPHeaders.mockResolvedValue(undefined);
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0 as any; });

      const result = await messagingService.sendMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockPage.goto).toHaveBeenCalledTimes(2);
    }, 30000);
  });

  describe('typeMessage', () => {
    it('should type message with human-like delays', async () => {
      const content = 'Test message';
      await messagingService['typeMessage'](content);
      expect(mockPage.type).toHaveBeenCalledTimes(content.length);
    });
  });

  describe('checkMessageStatus', () => {
    it('should return true when message is sent successfully', async () => {
      mockPage.evaluate.mockResolvedValue(true);
      const result = await messagingService['checkMessageStatus'](mockMessage);
      expect(result).toBe(true);
    });

    it('should return false when message fails to send', async () => {
      mockPage.evaluate.mockResolvedValue(false);
      const result = await messagingService['checkMessageStatus'](mockMessage);
      expect(result).toBe(false);
    });

    it('should handle errors during status check', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Status check failed'));
      const result = await messagingService['checkMessageStatus'](mockMessage);
      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('should close the browser', async () => {
      await messagingService.close();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      mockBrowser.close.mockRejectedValue(new Error('Close failed'));
      await expect(messagingService.close()).rejects.toThrow('Close failed');
    });
  });
}); 