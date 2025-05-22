import puppeteer from 'puppeteer';
import { logger } from './logger';

export async function createBrowser(): Promise<puppeteer.Browser> {
  try {
    logger.info('Création d\'une nouvelle instance de navigateur...');

    const browser = await puppeteer.launch({
      headless: false, // Nécessaire pour éviter la détection
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-notifications',
        '--disable-extensions',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      ignoreHTTPSErrors: true,
      userDataDir: './user-data', // Persistance des cookies et du cache
    });

    // Configurer les événements du navigateur
    browser.on('disconnected', () => {
      logger.warn('Le navigateur a été déconnecté');
    });

    browser.on('targetcreated', (target) => {
      logger.debug(`Nouvelle cible créée: ${target.url()}`);
    });

    browser.on('targetdestroyed', (target) => {
      logger.debug(`Cible détruite: ${target.url()}`);
    });

    logger.info('Instance de navigateur créée avec succès');
    return browser;
  } catch (error) {
    logger.error('Erreur lors de la création du navigateur:', error);
    throw new Error(`Échec de la création du navigateur: ${error.message}`);
  }
}

export async function createPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
  try {
    logger.info('Création d\'une nouvelle page...');

    const page = await browser.newPage();

    // Configurer les événements de la page
    page.on('console', (msg) => {
      logger.debug(`Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      logger.error('Erreur de page:', error);
    });

    page.on('request', (request) => {
      logger.debug(`Requête: ${request.method()} ${request.url()}`);
    });

    page.on('response', (response) => {
      logger.debug(`Réponse: ${response.status()} ${response.url()}`);
    });

    // Configurer les headers par défaut
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    // Configurer les timeouts
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);

    // Configurer les permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.linkedin.com', [
      'notifications',
      'geolocation',
    ]);

    logger.info('Page créée avec succès');
    return page;
  } catch (error) {
    logger.error('Erreur lors de la création de la page:', error);
    throw new Error(`Échec de la création de la page: ${error.message}`);
  }
}

export async function closeBrowser(browser: puppeteer.Browser): Promise<void> {
  try {
    logger.info('Fermeture du navigateur...');
    await browser.close();
    logger.info('Navigateur fermé avec succès');
  } catch (error) {
    logger.error('Erreur lors de la fermeture du navigateur:', error);
    throw new Error(`Échec de la fermeture du navigateur: ${error.message}`);
  }
} 