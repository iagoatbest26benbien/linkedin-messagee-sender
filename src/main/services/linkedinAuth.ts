import { Browser, Page } from 'puppeteer';
import { LinkedInCredentials } from '../../shared/types';
import { logger } from '../utils/logger';
import { createBrowser } from '../utils/browser';

export class LinkedInAuthService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isAuthenticated = false;

  async initialize() {
    try {
      logger.info('Initialisation du service d\'authentification LinkedIn...');

      const puppeteer = require('puppeteer');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 800 });

      logger.info('Service d\'authentification LinkedIn initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service d\'authentification:', error);
      throw error;
    }
  }

  async login(credentials: LinkedInCredentials): Promise<boolean> {
    try {
      if (!this.browser) {
        this.browser = await createBrowser();
      }

      if (!this.page) {
        this.page = await this.browser.newPage();
      }

      await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });
      await this.page.type('#username', credentials.email);
      await this.page.type('#password', credentials.password);
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });

      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Redirection vers une page inattendue');
      }

      return true;
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      return false;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      if (!this.browser) {
        this.browser = await createBrowser();
      }

      if (!this.page) {
        this.page = await this.browser.newPage();
      }

      await this.page.goto('https://www.linkedin.com/feed', { waitUntil: 'networkidle0' });
      const currentUrl = this.page.url();
      return !currentUrl.includes('/login');
    } catch (error) {
      logger.error('Erreur lors de la vérification de la connexion:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      if (!this.page) {
        throw new Error('Non connecté');
      }

      await this.page.goto('https://www.linkedin.com/m/logout/', { waitUntil: 'networkidle0' });
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  getPage(): any {
    return this.page;
  }

  async close(): Promise<void> {
    try {
      logger.info('Fermeture du service d\'authentification LinkedIn...');

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isAuthenticated = false;
      }

      logger.info('Service d\'authentification LinkedIn fermé avec succès');
    } catch (error) {
      logger.error('Erreur lors de la fermeture du service d\'authentification:', error);
      throw error;
    }
  }
} 