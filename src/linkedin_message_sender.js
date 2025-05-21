const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Fonction pour logger dans un fichier
function logToFile(message) {
    const logPath = path.join(__dirname, 'linkedin_sender.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(logPath, logMessage);
    console.log(message); // Afficher aussi dans la console
}

class LinkedInMessageSender {
    constructor(configPath = 'temp_config.json') {
        try {
            logToFile('Chargement de la configuration depuis ' + configPath);
            // Lire la configuration passée par le serveur via le fichier temporaire
            const configData = require(path.join(__dirname, configPath));
            this.config = configData;
            this.argument = this.config.argument; // Accéder à l'objet argument

            // Assurez-vous que les arguments nécessaires sont présents
            if (!this.argument || !this.argument.profileUrl || !this.argument.message) {
                 throw new Error('URL du profil ou message manquant dans la configuration.');
            }

            this.profileUrl = this.argument.profileUrl;
            this.messageText = this.argument.message;

            // Charger les identifiants LinkedIn
            const credentialsPath = path.join(__dirname, 'credentialss.json');
            if (!fs.existsSync(credentialsPath)) {
                throw new Error('Fichier credentialss.json manquant');
            }
            this.credentials = require(credentialsPath).linkedin;

            logToFile('Configuration chargée avec succès pour Puppeteer (message unique)');
        } catch (error) {
            logToFile(`Erreur lors du chargement de la configuration: ${error.message}`);
            throw error;
        }
    }

    async login(page) {
        logToFile('Tentative de connexion à LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });

        // Remplir le formulaire de connexion
        await page.type('#username', this.credentials.email);
        await page.type('#password', this.credentials.password);

        // Cliquer sur le bouton de connexion
        await page.click('button[type="submit"]');

        // Attendre que la navigation soit terminée
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Vérifier si la connexion a réussi
        const currentUrl = page.url();
        if (currentUrl.includes('feed')) {
            logToFile('Connexion à LinkedIn réussie');
            return true;
        } else {
            throw new Error('Échec de la connexion à LinkedIn');
        }
    }

    async sendMessage(page, profileUrl, messageText) {
        logToFile(`Navigation vers le profil: ${profileUrl}`);
        await page.goto(profileUrl, { waitUntil: 'networkidle2' });

        // Attendre que la page se charge et chercher le bouton message
        const messageButtonSelector = 'button:has(span:has-text("Message"))';
        try {
            await page.waitForSelector(messageButtonSelector, { timeout: 10000 });
            logToFile('Bouton Message trouvé.');
            await page.click(messageButtonSelector);

            // Attendre que la modale de message apparaisse
            const messageDialogSelector = '.msg-form__contenteditable[role="textbox"]';
            await page.waitForSelector(messageDialogSelector, { timeout: 10000 });
            logToFile('Modale de message ouverte.');

            // Taper le message
            await page.type(messageDialogSelector, messageText);
            logToFile('Message tapé.');

            // Cliquer sur le bouton Envoyer
            const sendButtonSelector = 'button[type="submit"]:has(span:has-text("Send"))';
            await page.waitForSelector(sendButtonSelector, { timeout: 5000 });
            await page.click(sendButtonSelector);
            logToFile('Message envoyé (bouton cliqué).');

            // Attendre un peu pour s'assurer que le message est envoyé
            await page.waitForTimeout(2000);

            logToFile(`Message envoyé avec succès à ${profileUrl}`);

        } catch (error) {
            logToFile(`Erreur lors de l'envoi du message à ${profileUrl}: ${error.message}`);
            throw error;
        }
    }

    async run() {
        logToFile('Lancement de l\'automatisation Puppeteer pour un message.');
        let browser;
        try {
            logToFile('Tentative de lancement du navigateur Puppeteer...');
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: process.env.CHROMIUM_PATH || (process.platform === 'linux' ? '/usr/bin/chromium-browser' : null)
            });
            logToFile('Navigateur Puppeteer lancé avec succès.');
            const page = await browser.newPage();

            // Se connecter à LinkedIn
            await this.login(page);

            // Envoyer le message
            await this.sendMessage(page, this.profileUrl, this.messageText);

            logToFile('Envoi du message terminé.');

        } catch (error) {
            logToFile(`Erreur lors du lancement ou de l'utilisation de Puppeteer: ${error.message}`);
            if (error.stack) {
                logToFile('Stack trace:\n' + error.stack);
            }
            // Tenter de fermer le navigateur même en cas d'erreur pendant le lancement ou l'utilisation
             if (browser) {
                await browser.close().catch(closeError => logToFile(`Erreur lors de la fermeture du navigateur après échec: ${closeError.message}`));
                logToFile('Navigateur Puppeteer fermé après erreur.');
            }
            throw error; // Rethrow l'erreur pour qu'elle soit gérée par le catch principal
        } finally {
           // Le bloc catch gère maintenant la fermeture du navigateur si nécessaire.
           // Ce finally n'est plus strictement nécessaire si le catch gère la fermeture, mais peut être gardé pour d'autres nettoyages.
           // if (browser && !browser.isConnected()) { // Ajout d'une condition pour éviter double fermeture si géré par catch
           //     // Si le navigateur existe mais n'est plus connecté, il a peut-être déjà été fermé ou a crashé.
           //     logToFile('Navigateur semble déjà fermé ou non connecté dans finally.');
           // }
        }
    }
}

// Le script sera lancé par le serveur et appellera run()
async function main() {
    try {
        const sender = new LinkedInMessageSender();
        await sender.run();
        logToFile('Script terminé avec succès.');
        process.exit(0);
    } catch (error) {
        logToFile(`Erreur fatale dans le script principal: ${error.message}`);
        process.exit(1);
    }
}

// Exécuter la fonction main
main().catch(async (error) => {
    await logToFile(`Erreur non gérée dans le script principal: ${error.message}`);
    process.exit(1);
}); 