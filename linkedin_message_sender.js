const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration du logging
const logToFile = async (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    await fs.appendFile('linkedin_sender.log', logMessage);
    console.log(message);
};

class LinkedInMessageSender {
    constructor(configPath = 'temp_config.json') {
        try {
            logToFile('Chargement de la configuration depuis ' + configPath);
            // Lire la configuration passée par le serveur via le fichier temporaire
            const configData = require('./' + configPath);
            this.config = configData;
            this.argument = this.config.argument;

            // Lire les identifiants n8n depuis credentials.json
            const credentialsPath = path.join(__dirname, 'credentials.json');
            const credentials = require(credentialsPath);
            this.n8nWebhookUrl = credentials.n8nWebhookUrl;
            this.n8nApiKey = credentials.n8nApiKey;

            if (!this.n8nWebhookUrl) {
                throw new Error('URL du webhook n8n manquante dans credentials.json');
            }

            // Récupérer les paramètres nécessaires pour n8n
            this.spreadsheetUrl = this.argument.spreadsheetUrl;
            this.sheetName = this.argument.sheetName;
            this.messageColumn = this.argument.messageColumn;
            this.profileUrlColumn = this.argument.profileUrlColumn;
            this.numberOfLaunches = parseInt(this.argument.numberOfLaunches) || 1;
            this.delayBetweenLaunchesMs = parseInt(this.argument.delayBetweenLaunchesMs) || 5000;

            logToFile('Configuration et identifiants n8n chargés avec succès');
        } catch (error) {
            logToFile(`Erreur lors du chargement de la configuration ou des identifiants: ${error.message}`);
            throw error;
        }
    }

    async run() {
        try {
            logToFile(`Démarrage du workflow n8n...`);

            // Vérification des paramètres
            logToFile(`Vérification des paramètres:
                - URL Spreadsheet: ${this.spreadsheetUrl ? 'Présente' : 'Manquante'}
                - Nom de la feuille: ${this.sheetName ? 'Présent' : 'Manquant'}
                - Colonne Messages: ${this.messageColumn ? 'Présente' : 'Manquante'}
                - Colonne URLs: ${this.profileUrlColumn ? 'Présente' : 'Manquante'}
                - Nombre de lancements: ${this.numberOfLaunches}
                - Délai entre lancements: ${this.delayBetweenLaunchesMs}ms`);

            // Préparer les données pour n8n
            const workflowData = {
                spreadsheetUrl: this.spreadsheetUrl,
                sheetName: this.sheetName,
                messageColumn: this.messageColumn,
                profileUrlColumn: this.profileUrlColumn,
                numberOfLaunches: this.numberOfLaunches,
                delayBetweenLaunchesMs: this.delayBetweenLaunchesMs
            };

            // Headers pour l'authentification n8n si nécessaire
            const headers = {
                'Content-Type': 'application/json'
            };
            if (this.n8nApiKey) {
                headers['X-N8N-API-KEY'] = this.n8nApiKey;
            }

            // Appel au webhook n8n
            logToFile(`Envoi de la requête au workflow n8n...`);
            try {
                const response = await axios.post(this.n8nWebhookUrl, workflowData, {
                    headers: headers,
                    timeout: 60000 // 60 secondes de timeout
                });

                logToFile(`Réponse du workflow n8n: ${JSON.stringify(response.data, null, 2)}`);
                
                if (response.data && response.data.success) {
                    logToFile(`Workflow n8n lancé avec succès.`);
                    return { success: true, data: response.data };
                } else {
                    throw new Error('Réponse inattendue du workflow n8n');
                }
            } catch (apiError) {
                logToFile(`Erreur lors de l'appel au workflow n8n:
                    Message: ${apiError.message}
                    ${apiError.response ? `
                    Status: ${apiError.response.status}
                    Headers: ${JSON.stringify(apiError.response.headers)}
                    Data: ${JSON.stringify(apiError.response.data)}` : 'Pas de réponse du serveur'}`);
                throw apiError;
            }

        } catch (error) {
            logToFile(`Erreur lors du lancement du workflow n8n: ${error.message}`);
            if (error.response) {
                logToFile(`Détails de l'erreur:
                    Status: ${error.response.status}
                    Headers: ${JSON.stringify(error.response.headers)}
                    Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
}

// Le script sera lancé par le serveur et appellera run()
async function main() {
    try {
        const sender = new LinkedInMessageSender();
        await sender.run();
        logToFile('Script terminé.');
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