import { Browser, Page } from 'puppeteer';
import { Message, MessageStatus } from '../../shared/types';
import { logger } from '../utils/logger';
import { createBrowser } from '../utils/browser';

export class LinkedInMessagingService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;

  async initialize() {
    try {
      logger.info('Initialisation du service de messagerie LinkedIn...');

      this.browser = await createBrowser();
      this.page = await this.browser.newPage();

      await this.page.setViewport({ width: 1280, height: 800 });
      await this.page.setDefaultNavigationTimeout(30000);
      await this.page.setDefaultTimeout(30000);

      // Configuration des en-têtes pour éviter la détection
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      });

      logger.info('Service de messagerie LinkedIn initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service de messagerie:', error);
      throw error;
    }
  }

  async sendMessage(message: Message): Promise<boolean> {
    if (!this.browser) {
      this.browser = await createBrowser();
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
    }

    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        logger.info(`Tentative d'envoi du message à ${message.recipientUrl} (tentative ${retries + 1}/${this.MAX_RETRIES})`);

        await this.page.goto(message.recipientUrl, { waitUntil: 'networkidle0' });
        await this.page.waitForSelector('button[aria-label="Message"]', { timeout: 10000 });
        await this.page.click('button[aria-label="Message"]');
        await this.page.waitForTimeout(2000);

        const isMessageButtonClickable = await this.page.evaluate(() => {
          const messageButton = document.querySelector('button[aria-label="Message"]');
          return messageButton && !messageButton.hasAttribute('disabled');
        });

        if (!isMessageButtonClickable) {
          throw new Error('Le bouton de message n\'est pas cliquable');
        }

        await this.typeMessage(message.content);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);

        const success = await this.checkMessageStatus(message);
        if (success) {
          logger.info('Message envoyé avec succès');
          return true;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          logger.warn(`Échec de l'envoi, nouvelle tentative dans ${this.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      } catch (error) {
        logger.error(`Erreur lors de l'envoi du message (tentative ${retries + 1}):`, error);
        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    throw new Error('Échec de l\'envoi du message après plusieurs tentatives');
  }

  private async typeMessage(content: string): Promise<void> {
    for (const char of content) {
      await this.page?.type('div[role="textbox"]', char);
      await this.page?.waitForTimeout(Math.random() * 100 + 50);
    }
  }

  private async checkMessageStatus(message: Message): Promise<boolean> {
    try {
      return await this.page?.evaluate(() => {
        const messageInput = document.querySelector('div[role="textbox"]');
        return !messageInput || messageInput.textContent === '';
      }) ?? false;
    } catch (error) {
      logger.error('Erreur lors de la vérification du statut du message:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      logger.info('Fermeture du service de messagerie LinkedIn...');

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      logger.info('Service de messagerie LinkedIn fermé avec succès');
    } catch (error) {
      logger.error('Erreur lors de la fermeture du service de messagerie:', error);
      throw error;
    }
  }
} 