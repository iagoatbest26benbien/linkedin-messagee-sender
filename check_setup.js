// const fs = require('fs');
// const path = require('path');

// async function checkSetup() {
//     const errors = [];
//     const warnings = [];

//     // Vérifier les fichiers requis
//     const requiredFiles = [
//         'config.json',
//         'credentials.json',
//         'linkedin_message_sender.js'
//     ];

//     for (const file of requiredFiles) {
//         if (!fs.existsSync(path.join(__dirname, file))) {
//             errors.push(`Le fichier ${file} est manquant`);
//         }
//     }

//     // Vérifier le contenu de config.json
//     try {
//         const config = require('./config.json');
//         const requiredConfigFields = [
//             'argument.spreadsheetUrl',
//             'argument.sessionCookie',
//             'argument.userAgent',
//             'argument.message',
//             'argument.columnName',
//             'argument.profilesPerLaunch',
//             'nbLaunches'
//         ];

//         for (const field of requiredConfigFields) {
//             const value = field.split('.').reduce((obj, key) => obj && obj[key], config);
//             if (!value) {
//                 errors.push(`Le champ ${field} est manquant dans config.json`);
//             }
//         }
//     } catch (error) {
//         errors.push(`Erreur lors de la lecture de config.json: ${error.message}`);
//     }

//     // Vérifier les dépendances
//     try {
//         const packageJson = require('./package.json');
//         const requiredDependencies = [
//             'puppeteer',
//             'googleapis',
//             'express'
//         ];

//         for (const dep of requiredDependencies) {
//             if (!packageJson.dependencies[dep]) {
//                 errors.push(`La dépendance ${dep} est manquante dans package.json`);
//             }
//         }
//     } catch (error) {
//         errors.push(`Erreur lors de la lecture de package.json: ${error.message}`);
//     }

//     // Vérifier l'installation des dépendances
//     try {
//         require.resolve('puppeteer');
//     } catch (error) {
//         errors.push('Puppeteer n\'est pas installé. Exécutez "npm install"');
//     }

//     // Afficher les résultats
//     if (errors.length > 0) {
//         console.error('\nErreurs trouvées:');
//         errors.forEach(error => console.error(`❌ ${error}`));
//     }

//     if (warnings.length > 0) {
//         console.warn('\nAvertissements:');
//         warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
//     }

//     if (errors.length === 0 && warnings.length === 0) {
//         console.log('✅ Tous les vérifications sont passées avec succès!');
//     }

//     return errors.length === 0;
// }

// // Si le fichier est exécuté directement
// if (require.main === module) {
//     checkSetup().then(success => {
//         if (!success) {
//             console.error('\nVeuillez corriger les erreurs avant de lancer le script.');
//             process.exit(1);
//         }
//     });
// }

// // Exporter la fonction pour l'utiliser comme module
// module.exports = checkSetup; 