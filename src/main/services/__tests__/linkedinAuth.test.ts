import { jest } from '@jest/globals';
import { LinkedInAuthService } from '../linkedinAuth';
import { LinkedInCredentials } from '../../../shared/types';
import { createBrowser } from '../../utils/browser';
import { logger } from '../../utils/logger';

// Mock des dépendances
jest.mock('../../utils/browser');
jest.mock('../../utils/logger');

describe('LinkedInAuthService', () => {
  let authService: LinkedInAuthService;
  let mockBrowser: any;
  let mockPage: any;
  let mockCredentials: LinkedInCredentials;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      type: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      waitForNavigation: jest.fn().mockResolvedValue(undefined),
      url: jest.fn().mockReturnValue('https://www.linkedin.com/feed'),
      setViewport: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (createBrowser as jest.Mock).mockResolvedValue(mockBrowser);

    mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    authService = new LinkedInAuthService();
    (authService as any).browser = mockBrowser;
    (authService as any).page = mockPage;
  });

  afterEach(async () => {
    await authService.close();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const result = await authService.login(mockCredentials);
      expect(result).toBe(true);
      expect(mockPage.goto).toHaveBeenCalledWith('https://www.linkedin.com/login', expect.any(Object));
      expect(mockPage.type).toHaveBeenCalledWith('#username', mockCredentials.email);
      expect(mockPage.type).toHaveBeenCalledWith('#password', mockCredentials.password);
      expect(mockPage.click).toHaveBeenCalledWith('button[type="submit"]');
    });

    it('should return false when login fails', async () => {
      mockPage.url.mockReturnValue('https://www.linkedin.com/login');
      const result = await authService.login(mockCredentials);
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Network error'));
      const result = await authService.login(mockCredentials);
      expect(result).toBe(false);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when user is logged in', async () => {
      mockPage.url.mockReturnValue('https://www.linkedin.com/feed');
      const result = await authService.isLoggedIn();
      expect(result).toBe(true);
    });

    it('should return false when user is not logged in', async () => {
      mockPage.url.mockReturnValue('https://www.linkedin.com/login');
      const result = await authService.isLoggedIn();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockPage.goto.mockRejectedValue(new Error('Network error'));
      const result = await authService.isLoggedIn();
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should successfully log out', async () => {
      await authService.logout();
      expect(mockPage.goto).toHaveBeenCalledWith('https://www.linkedin.com/m/logout/', expect.any(Object));
    });

    it('should handle logout errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Logout failed'));
      await expect(authService.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('close', () => {
    it('should close the browser', async () => {
      await authService.close();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      mockBrowser.close.mockRejectedValue(new Error('Close failed'));
      await expect(authService.close()).rejects.toThrow('Close failed');
    });
  });
}); 