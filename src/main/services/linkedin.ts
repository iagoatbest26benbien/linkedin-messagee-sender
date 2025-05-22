import puppeteer, { Browser, Page } from 'puppeteer';
import Store from 'electron-store';
import { LinkedInCredentials, Message } from '../../shared/types';

class LinkedInService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private store: Store;
  private isLoggedIn: boolean = false;

  constructor() {
    this.store = new Store({
      name: 'linkedin-sender',
      encryptionKey: 'your-encryption-key' // À changer en production
    });
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async login(credentials: LinkedInCredentials) {
    try {
      await this.init();
      if (!this.browser) throw new Error('Browser not initialized');

      this.page = await this.browser.newPage();
      await this.page.goto('https://www.linkedin.com/login');

      // Remplir le formulaire de connexion
      await this.page.type('#username', credentials.email);
      await this.page.type('#password', credentials.password);
      await this.page.click('button[type="submit"]');

      // Attendre la redirection après connexion
      await this.page.waitForNavigation();

      // Vérifier si la connexion a réussi
      const isLoggedIn = await this.page.evaluate(() => {
        return !document.querySelector('.login__form');
      });

      if (!isLoggedIn) {
        throw new Error('Échec de la connexion');
      }

      this.isLoggedIn = true;
      await this.store.set('credentials', credentials);
    } catch (error) {
      this.isLoggedIn = false;
      throw error;
    }
  }

  async sendMessage(message: Message) {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Non connecté à LinkedIn');
    }

    try {
      // Naviguer vers le profil du destinataire
      await this.page.goto(message.recipientUrl);

      // Attendre que le bouton de message soit disponible
      await this.page.waitForSelector('button[aria-label*="Message"]');
      await this.page.click('button[aria-label*="Message"]');

      // Attendre que la boîte de dialogue de message s'ouvre
      await this.page.waitForSelector('.msg-form__contenteditable');

      // Écrire le message
      await this.page.type('.msg-form__contenteditable', message.content);

      // Envoyer le message
      await this.page.click('button[type="submit"]');

      // Attendre la confirmation d'envoi
      await this.page.waitForSelector('.msg-form__send-status--sent');

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
      }
      throw new Error('Erreur inconnue lors de l\'envoi du message');
    }
  }

  async getCredentials(): Promise<LinkedInCredentials | null> {
    return this.store.get('credentials') as LinkedInCredentials || null;
  }

  async saveCredentials(credentials: LinkedInCredentials) {
    await this.store.set('credentials', credentials);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }
}

export const linkedInService = new LinkedInService(); 