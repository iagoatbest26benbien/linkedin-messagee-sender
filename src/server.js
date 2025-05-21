const express = require('express');
const path = require('path');
const fs = require('fs'); // Importation du module fs standard
const fsp = require('fs').promises; // Utiliser un autre nom pour fs.promises
const cors = require('cors');
const axios = require('axios'); // Importer axios pour les appels HTTP

const app = express();
const port = process.env.PORT || 3000; // Utiliser le port de l'environnement ou 3000 par défaut

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

// Créer le fichier credentialss.json à partir des variables d'environnement
const createCredentialsFile = () => {
    const credentialsPath = path.join(__dirname, 'credentialss.json');
    const credentials = {
        linkedin: {
            email: process.env.LINKEDIN_EMAIL,
            password: process.env.LINKEDIN_PASSWORD
        }
    };

    try {
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
        console.log('Fichier credentialss.json créé avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la création du fichier credentialss.json:', error);
        return false;
    }
};

// Vérifier et créer le fichier credentialss.json si nécessaire
if (!fs.existsSync(path.join(__dirname, 'credentialss.json'))) {
    if (!createCredentialsFile()) {
        console.error('Impossible de créer le fichier credentialss.json. Vérifiez les variables d\'environnement LINKEDIN_EMAIL et LINKEDIN_PASSWORD.');
    }
}

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

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

// Route principale pour servir index.html depuis le dossier 'public'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
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

// Route appelée par n8n pour déclencher l'envoi d'un message via Puppeteer
app.post('/process-message', async (req, res) => {
    console.log('Received request to /process-message from n8n');
    const { profileUrl, message } = req.body; // Attendre profileUrl et message de n8n

    if (!profileUrl || !message) {
        console.error('Missing profileUrl or message in /process-message request');
        // Envoyer une erreur via SSE si des clients sont connectés
        sseClients.forEach(client => {
            client.write(`event: error\ndata: Erreur: URL du profil ou message manquant dans la requête de n8n.\n\n`);
        });
        return res.status(400).json({ success: false, error: 'profileUrl and message are required.' });
    }

    // Créer un fichier de configuration temporaire pour passer les arguments au script Puppeteer
    const tempConfigPath = '/opt/render/project/src/temp_config.json'; // Utiliser un chemin absolu cohérent
    try {
      await fsp.writeFile(tempConfigPath, JSON.stringify({ argument: { profileUrl, message } }, null, 2));
      console.log('Temp config file created for single message:', tempConfigPath);
    } catch (error) {
      console.error('Error creating temp config file for /process-message:', error);
      sseClients.forEach(client => {
          client.write(`event: error\ndata: Erreur lors de la création du fichier de configuration temporaire.\n\n`);
      });
      return res.status(500).json({ success: false, error: 'Failed to create temp config file.' });
    }

    // Chemin vers le script d'envoi de message (maintenant dans src)
    const senderScriptPath = path.join(__dirname, 'linkedin_message_sender.js');

    // Utiliser spawn pour exécuter le script dans un nouveau processus
    const { spawn } = require('child_process');
    const scriptProcess = spawn('node', [senderScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname
    });

    let scriptOutput = '';
    let scriptErrorOutput = '';

    scriptProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log('Script Output (', profileUrl, '):', message);
        // Envoyer la sortie standard au client via SSE
        sseClients.forEach(client => {
            client.write(`event: log\ndata: ${message}\n\n`);
        });
        scriptOutput += message;
    });

    scriptProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error('Script Error (', profileUrl, '):', message);
        // Envoyer les erreurs standard au client via SSE
        sseClients.forEach(client => {
            client.write(`event: error\ndata: ${message}\n\n`);
        });
        scriptErrorOutput += message;
    });

    scriptProcess.on('error', (error) => {
        console.error('Failed to start sender script process for', profileUrl, ':', error);
         // Inform the client about the failure
         sseClients.forEach(client => {
             client.write(`event: error\ndata: Erreur: Échec du démarrage du script pour ${profileUrl}: ${error.message}\n\n`);
              // Send a complete event for this single process
             client.write(`event: complete\ndata: ${JSON.stringify({ success: false, message: 'Failed to start sender script process.', profileUrl: profileUrl })}\n\n`);
         });
        // Try to clean up the temporary file even on process start error
        const tempConfigPathRoot = '/opt/render/project/src/temp_config.json'; // Utiliser un chemin absolu cohérent
        fsp.unlink(tempConfigPathRoot).catch(err => console.error('Error deleting temp config file after spawn error:', err));
        // Not sending HTTP response here, n8n expects 200 for the POST request
    });

    scriptProcess.on('close', (code) => {
        console.log(`Sender script process for ${profileUrl} exited with code ${code}`);

        // Nettoyer le fichier de configuration temporaire
        const tempConfigPathRoot = '/opt/render/project/src/temp_config.json'; // Utiliser un chemin absolu cohérent
        fsp.unlink(tempConfigPathRoot).catch(err => console.error('Error deleting temp config file:', err));

        // Envoyer un événement de fin pour ce message spécifique
         const result = code === 0 ? 
             { success: true, message: 'Message traité avec succès.', profileUrl: profileUrl } : 
             { success: false, message: `Échec du traitement du message. Code: ${code}. Erreurs: ${scriptErrorOutput.trim() || 'None'}`, profileUrl: profileUrl };

         sseClients.forEach(client => {
              client.write(`event: messageComplete\ndata: ${JSON.stringify(result)}\n\n`); // Utilisez un événement différent pour les messages individuels
         });

        // Ne pas envoyer de réponse HTTP ici, n8n gère sa propre boucle
    });

    // Réponse immédiate à n8n pour ne pas bloquer son workflow
    res.status(200).json({ success: true, message: 'Request received, processing message.' });
});

// Route /send appelée par l'interface web pour déclencher le workflow n8n
app.post('/send', async (req, res) => {
  console.log('Received request to /send to trigger n8n workflow');
  const n8nWorkflowData = req.body; // Les arguments pour n8n (Google Sheet, etc.)

  // !!! Placeholder pour l'URL du webhook n8n !!!
  const n8nWebhookUrl = 'https://ael26.app.n8n.cloud/webhook/linkedin-message-sender'; // <-- URL du webhook n8n

  if (n8nWebhookUrl === 'VOTRE_URL_WEBHOOK_N8N_ICI') { // Cette vérification sera toujours fausse maintenant
       const errorMsg = 'Erreur: URL du webhook n8n non configurée dans server.js';
       console.error(errorMsg);
        sseClients.forEach(client => {
           client.write(`event: error\ndata: ${errorMsg}\n\n`);
       });
       return res.status(500).json({ success: false, error: errorMsg });
  }

  console.log('Triggering n8n workflow at:', n8nWebhookUrl);

  try {
      // Assurez-vous que n8n est configuré pour accepter les données du corps de la requête
      // et utiliser ces données pour lire la Google Sheet
      const n8nResponse = await axios.post(n8nWebhookUrl, n8nWorkflowData);

      console.log('n8n webhook responded with status:', n8nResponse.status);
      console.log('n8n webhook response data:', n8nResponse.data);

      if (n8nResponse.status >= 200 && n8nResponse.status < 300) {
         // Si n8n est déclenché avec succès, la suite est gérée par n8n appelant /process-message
         // et le flux SSE
        res.status(200).json({ success: true, message: 'Workflow n8n triggered successfully. Check status stream for updates.' });
        sseClients.forEach(client => {
            client.write(`event: status\ndata: Workflow n8n déclenché. Le traitement des messages va commencer.\n\n`);
        });
      } else {
         const errorDetails = n8nResponse.data ? JSON.stringify(n8nResponse.data) : n8nResponse.statusText;
          console.error(`n8n webhook returned non-success status ${n8nResponse.status}: ${errorDetails}`);
          res.status(n8nResponse.status).json({ success: false, error: `n8n webhook returned status ${n8nResponse.status}: ${errorDetails}` });
           sseClients.forEach(client => {
              client.write(`event: error\ndata: Échec du déclenchement du workflow n8n: ${errorDetails}\n\n`);
          });
      }

  } catch (error) {
      console.error('Error triggering n8n workflow:', error.message);
      if (error.response) {
        console.error('n8n response error data:', error.response.data);
        console.error('n8n response error status:', error.response.status);
      }
      res.status(500).json({ success: false, error: `An unexpected error occurred while triggering n8n: ${error.message}` });
       sseClients.forEach(client => {
          client.write(`event: error\ndata: Erreur lors du déclenchement du workflow n8n: ${error.message}\n\n`);
      });
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
    console.log(`Server running at http://localhost:${port}`);
    console.log('Access the application at http://localhost:3000');
    console.log('Ensure credentialss.json is present in the src directory.');

    if (!fs.existsSync(path.join(__dirname, 'credentialss.json'))) {
        console.warn('Le serveur a démarré mais le fichier credentialss.json est manquant.');
        console.warn('Veuillez créer ce fichier dans le dossier src pour que l\'application fonctionne correctement.');
    }
}); 