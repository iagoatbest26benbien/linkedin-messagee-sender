const express = require('express');
const path = require('path');
const fs = require('fs'); // Importation du module fs standard
const fsp = require('fs').promises; // Utiliser un autre nom pour fs.promises
const cors = require('cors');
const axios = require('axios'); // Importer axios pour les appels HTTP

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Keep track of all connected SSE clients
let sseClients = [];

// Middleware pour logger toutes les requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    // Ne pas loguer les corps de requêtes SSE pour éviter le spam dans les logs
    if (req.url !== '/status-stream') {
        console.log('Request Body:', req.body);
    }
    next();
});

// Vérifier l'existence des fichiers requis au démarrage du serveur
const requiredFiles = ['credentials.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
    console.error('Fichiers essentiels manquants pour le démarrage:', missingFiles);
    console.error("Veuillez créer ces fichiers pour que l'application fonctionne.");
    // On n'arrête pas le process ici pour permettre au front de potentiellement afficher un message
}

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Cette route de vérification de setup n'est plus utilisée par l'interface simplifiée
// mais peut être conservée si besoin pour du debug ou autre
/*
app.get('/check-setup', async (req, res) => {
    console.log('Vérification de la configuration...');
    
    try {
        const checkSetupPath = path.join(__dirname, 'check_setup.js');
        
        // Note: check_setup.js peut encore être utile pour vérifier les dépendances et le format de config.json/credentialss.json
        // même si la config est maintenant passée dynamiquement.
        // Pour l'instant, je vais le laisser mais on pourrait le réévaluer.

        if (!fs.existsSync(checkSetupPath)) {
            throw new Error(`Le fichier check_setup.js n'existe pas dans ${__dirname}`);
        }

        const checkProcess = spawn('node', [checkSetupPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
        });

        let output = '';
        let errorOutput = '';

        checkProcess.stdout.on('data', (data) => {
            const message = data.toString();
            console.log('Sortie standard:', message);
            output += message;
        });

        checkProcess.stderr.on('data', (data) => {
            const message = data.toString();
            console.error('Erreur standard:', message);
            errorOutput += message;
        });

        checkProcess.on('error', (error) => {
            console.error('Erreur lors de l'exécution du script de vérification:', error);
            res.status(500).json({
                success: false,
                output: `Erreur lors de l'exécution du script: ${error.message}`
            });
        });

        checkProcess.on('close', (code) => {
            console.log(`Script de vérification terminé avec le code: ${code}`);
            if (code !== 0) {
                res.status(400).json({
                    success: false,
                    output: errorOutput || output || 'Erreur inconnue lors de la vérification'
                });
            } else {
                res.json({
                    success: true,
                    output: output
                });
            }
        });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        res.status(500).json({
            success: false,
            output: `Erreur inattendue: ${error.message}`
        });
    }
});
*/

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// New SSE endpoint for client to receive status updates
app.get('/status-stream', (req, res) => {
    console.log('Client connected to status stream.');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin for testing

    // Send a welcome message or initial status
    res.write('event: status\ndata: Connexion au suivi établie.\n\n');

    // Add this client to the list
    sseClients.push(res);

    // Handle client disconnection
    req.on('close', () => {
        console.log('Client disconnected from status stream.');
        sseClients = sseClients.filter(client => client !== res);
    });
});

// New endpoint for n8n workflow to send status/progress updates
app.post('/n8n-update', (req, res) => {
    console.log('Received update from n8n workflow.');
    const update = req.body; // Expected format: { type: 'status' | 'progress' | 'complete', data: 'message' | percentage }
    console.log('Update data:', update);

    if (!update || !update.type || update.data === undefined) {
        console.warn('Invalid update format received from n8n', update);
        return res.status(400).send('Invalid update format.');
    }

    // Send the update to all connected SSE clients
    const eventType = update.type;
    // Send data as JSON string if it's an object, otherwise send directly
    const eventData = (typeof update.data === 'object' || update.type === 'complete') ? JSON.stringify(update.data) : update.data;

    sseClients.forEach(client => {
        client.write(`event: ${eventType}\ndata: ${eventData}\n\n`);
    });

    res.status(200).send('Update received.');
});

// Route appelée par n8n pour envoyer un message LinkedIn
/*
app.post('/api/send-message', async (req, res) => {
    console.log('Received request to /api/send-message from n8n');
    const { message, profileUrl } = req.body; // Recevoir le message et l'URL du profil de n8n
    console.log('Message received:', message);
    console.log('Profile URL received:', profileUrl);

    if (!message || !profileUrl) {
        console.error('Missing message or profile URL in /api/send-message request');
        return res.status(400).json({ success: false, error: 'Message and profile URL are required.' });
    }

    try {
        // Lire les identifiants depuis les variables d'environnement
        const linkedinUsername = process.env.LINKEDIN_USERNAME;
        const linkedinPassword = process.env.LINKEDIN_PASSWORD;
        const linkedinCookie = process.env.LINKEDIN_COOKIE; // Peut être undefined si non utilisé
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        const n8nApiKey = process.env.N8N_API_KEY; // Peut être undefined si non utilisé

        // Vérification des variables d'environnement requises
        if ((!linkedinUsername || !linkedinPassword) && !linkedinCookie) {
            const errorMsg = 'LinkedIn credentials (username/password or cookie) are missing in environment variables.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!n8nWebhookUrl) {
            const errorMsg = 'n8n Webhook URL is missing in environment variables.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const client = new Client();
        console.log('LinkedIn client created');

        // Connexion à LinkedIn (utiliser user/pass ou cookie)
        console.log('Attempting to log in to LinkedIn...');
        if (linkedinCookie) {
             await client.login.cookie(linkedinCookie);
             console.log('Logged in to LinkedIn using cookie.');
        } else {
             await client.login.userPass({ username: linkedinUsername, password: linkedinPassword });
             console.log('Logged in to LinkedIn using username/password.');
        }

        // Extraction de l'ID du profil à partir de l'URL
        let profileId;
        try {
            const urlParts = profileUrl.split('/in/');
            if (urlParts.length > 1) {
                profileId = urlParts[1].split('/')[0];
            } else {
                 console.warn(`Could not extract profile ID from URL: ${profileUrl}.`);
                 // Fallback or error based on expected URL format
                 throw new Error(`Could not extract profile ID from URL: ${profileUrl}. Please ensure URLs are in the format https://www.linkedin.com/in/profile-id/`);
            }
            console.log('Profile ID extracted:', profileId);

        } catch (idError) {
            console.error('Error extracting profile ID:', idError.message);
            return res.status(400).json({ success: false, error: `Failed to extract profile ID from URL: ${profileUrl}` });
        }

        // Envoi du message
        console.log(`Attempting to send message to profile ID: ${profileId}`);

        const result = await client.message.sendMessage({
            profileId: profileId,
            message: message
        });
        console.log('LinkedIn message send result:', JSON.stringify(result));

        res.json({ success: true, message: 'Message sent successfully', result: result });
    } catch (error) {
        console.error('Error sending LinkedIn message:', error.message);
        if (error.response) {
             console.error('LinkedIn API error response:', error.response.data);
             console.error('LinkedIn API error status:', error.response.status);
         }
        res.status(500).json({ success: false, error: error.message });
    }
});
*/

// Route /send appelée par l'interface web pour déclencher le workflow n8n
app.post('/send', async (req, res) => {
  console.log('Received request to /send to trigger n8n workflow');
  const workflowData = req.body;

  // Vérifier les paramètres nécessaires avant d'appeler n8n
  if (!workflowData.spreadsheetUrl || !workflowData.sheetName || !workflowData.messageColumn || !workflowData.profileUrlColumn || !workflowData.numberOfLaunches || !workflowData.delayBetweenLaunchesMs) {
    console.error('Missing required parameters in request body:', workflowData);
    return res.status(400).send('Missing required parameters.');
  }

  try {
    const credentialsPath = path.join(__dirname, 'credentialss.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const n8nWebhookUrl = credentials.n8nWebhookUrl;
    const n8nApiKey = credentials.n8nApiKey;

    if (!n8nWebhookUrl) {
        const errorMsg = 'n8n Webhook URL is missing in credentialss.json';
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    }

    console.log('Triggering n8n workflow at:', n8nWebhookUrl);

    const headers = { 'Content-Type': 'application/json' };
    if (n8nApiKey) {
        headers['X-N8N-API-KEY'] = n8nApiKey;
    }

    const n8nResponse = await axios.post(n8nWebhookUrl, workflowData, { headers: headers });

    console.log('n8n webhook responded with status:', n8nResponse.status);
    console.log('n8n webhook response data:', n8nResponse.data);

    if (n8nResponse.status >= 200 && n8nResponse.status < 300) {
       // If n8n successfully receives the request, subsequent updates come via /n8n-update endpoint
       // The 'complete' event will be sent by n8n calling /n8n-update when its workflow finishes
      res.status(200).send(n8nResponse.data ? JSON.stringify(n8nResponse.data) : 'Workflow n8n triggered successfully.');
    } else {
       const errorDetails = n8nResponse.data ? JSON.stringify(n8nResponse.data) : n8nResponse.statusText;
        console.error(`n8n webhook returned non-success status ${n8nResponse.status}: ${errorDetails}`);
        res.status(n8nResponse.status).send(`n8n webhook returned status ${n8nResponse.status}: ${errorDetails}`);
    }

  } catch (error) {
    console.error('Error triggering n8n workflow:', error.message);
    if (error.response) {
      console.error('n8n response error data:', error.response.data);
      console.error('n8n response error status:', error.response.status);
    }
    res.status(500).send(`An unexpected error occurred: ${error.message}`);
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur globale:', err.stack);
     if (!res.headersSent) {
        res.status(500).json({
            error: 'Une erreur est survenue',
            details: err.message
        });
     }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    console.log('Répertoire de travail:', __dirname);

    if (missingFiles.length > 0) {
        console.warn('Le serveur a démarré mais des fichiers requis sont manquants:', missingFiles);
        console.warn(`Veuillez créer ces fichiers pour que l'application fonctionne correctement.`);
    }
}); 