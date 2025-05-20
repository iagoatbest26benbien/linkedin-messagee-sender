const express = require('express');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour démarrer le bot
app.post('/api/start', async (req, res) => {
    try {
        const { email, password, profiles, message } = req.body;
        
        // Démarrer le navigateur
        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Connexion à LinkedIn
        await page.goto('https://www.linkedin.com/login');
        await page.fill('#username', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');

        // Attendre la connexion
        await page.waitForNavigation();

        // Envoyer les messages
        for (const profile of profiles) {
            try {
                await page.goto(profile);
                await page.click('button:has-text("Message")');
                await page.fill('textarea[placeholder="Write a message…"]', message);
                await page.click('button:has-text("Send")');
                await page.waitForTimeout(2000); // Attendre 2 secondes entre chaque message
            } catch (error) {
                console.error(`Erreur lors de l'envoi du message à ${profile}:`, error);
            }
        }

        await browser.close();
        res.json({ success: true, message: 'Messages envoyés avec succès' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
}); 