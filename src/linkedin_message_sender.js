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
            // Retire la lecture de numberOfLaunches et delayBetweenLaunchesMs
            // this.numberOfLaunches = parseInt(this.argument.numberOfLaunches) || 1;
            // this.delayBetweenLaunchesMs = parseInt(this.argument.delayBetweenLaunchesMs) || 5000;

            logToFile('Configuration chargée avec succès pour Puppeteer (message unique)');
        } catch (error) {
            logToFile(`Erreur lors du chargement de la configuration: ${error.message}`);
            throw error;
        }
    }

    async sendMessage(page, profileUrl, messageText) {
        logToFile(`Navigation vers le profil: ${profileUrl}`);
        await page.goto(profileUrl, { waitUntil: 'networkidle2' });

        // Attendre que la page se charge et chercher le bouton message
        // Sélecteurs peuvent varier, celui-ci est un exemple typique
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

            // Optionnel: Attendre confirmation ou fermeture de la modale
            // await page.waitForFunction('!document.querySelector(".msg-form__contenteditable[role=\"textbox\"]")', { timeout: 10000 }).catch(() => logToFile('Modale de message n'a pas disparu après envoi, ce n'est pas forcément une erreur.'));

            logToFile(`Message envoyé avec succès à ${profileUrl}`);

        } catch (error) {
            logToFile(`Erreur lors de l'envoi du message à ${profileUrl}: ${error.message}`);
            // Gérer l'erreur (ex: bouton non trouvé, modale non ouverte, etc.)
            throw error; // Propage l'erreur pour l'enregistrer dans les logs principaux
        }
    }

    async run() {
        // logToFile(`Lancement de l'automatisation Puppeteer pour ${this.numberOfLaunches} lancements.`); // Retire ce log
        logToFile('Lancement de l\'automatisation Puppeteer pour un message.');
        let browser;
        try {
            browser = await puppeteer.launch({ headless: true }); // Changez headless sur false pour voir le navigateur
            const page = await browser.newPage();

            // !!! NOTE IMPORTANTE !!!
            // Puppeteer ne gère pas automatiquement l'authentification LinkedIn.
            // Vous devez soit:
            // 1. Charger des cookies de session existants.
            // 2. Implémenter un flux de connexion (très complexe et sujet aux changements de LinkedIn).
            // Actuellement, le script suppose que vous êtes déjà connecté ou que les cookies sont gérés.
            // Sans authentification, la navigation échouera probablement.
            logToFile('Assurez-vous que l'authentification LinkedIn est gérée (ex: via cookies).');
            // Exemple (non implémenté ici) : await page.setCookie(...vos_cookies_linkedin...);

            // Supprime la boucle for - on envoie un seul message par exécution du script
            // for (let i = 0; i < this.numberOfLaunches; i++) {
            //     logToFile(`Lancement ${i + 1} sur ${this.numberOfLaunches}`);
                 await this.sendMessage(page, this.profileUrl, this.messageText);

            //     if (i < this.numberOfLaunches - 1) {
            //         logToFile(`Attente de ${this.delayBetweenLaunchesMs}ms avant le prochain lancement...`);
            //         await new Promise(resolve => setTimeout(resolve, this.delayBetweenLaunchesMs));
            //     }
            // }

            logToFile('Envoi du message terminé.'); // Met à jour ce log

        } catch (error) {
            logToFile(`Erreur globale lors de l'exécution Puppeteer: ${error.message}`);
            throw error; // Propage l'erreur
        } finally {
            if (browser) {
                await browser.close();
                logToFile('Navigateur Puppeteer fermé.');
            }
        }
    }
}

// Le script sera lancé par le serveur et appellera run()
async function main() {
    try {
        const sender = new LinkedInMessageSender();
        await sender.run();
        logToFile('Script terminé avec succès.');
        process.exit(0); // Indique succès
    } catch (error) {
        logToFile(`Erreur fatale dans le script principal: ${error.message}`);
        process.exit(1); // Indique erreur
    }
}

// Exécuter la fonction main
main().catch(async (error) => {
    await logToFile(`Erreur non gérée dans le script principal: ${error.message}`);
    process.exit(1);
}); 