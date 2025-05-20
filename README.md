# LinkedIn Message Sender via Phantombuster

## Description
Application web locale pour déclencher l'envoi automatique de messages sur LinkedIn en utilisant un agent Phantombuster configuré, basé sur une liste de profils provenant de Google Sheets.

## Architecture
L'application fonctionne localement avec une interface web simple. Lorsque vous lancez le processus, le serveur local envoie les paramètres nécessaires à un script Node.js, qui à son tour appelle l'API de Phantombuster pour exécuter votre agent d'envoi de messages LinkedIn.

Interface Web (index.html) <-> Serveur Express (server.js) <-> Script (linkedin_message_sender.js) <-> API Phantombuster <-> Votre Agent Phantombuster

## Prérequis
- Node.js (version 14 ou supérieure)
- Un compte Google avec accès à Google Sheets
- Un compte LinkedIn avec une session active (cookie `li_at`)
- Un compte Phantombuster avec un agent configuré pour l'envoi de messages LinkedIn à partir d'une Google Sheet.
- Votre clé API Phantombuster et l'ID de l'agent à utiliser.

## Installation

1. Clonez ou téléchargez ce dépôt.

2. Ouvrez votre terminal dans le dossier du projet et installez les dépendances :
```bash
npm install
```

3. Configurez vos identifiants et paramètres :
   - Créez un fichier `credentials.json` à la racine du projet s'il n'existe pas. Ajoutez-y votre clé API Phantombuster et l'ID de l'agent comme suit (vous pouvez garder d'autres informations si nécessaire, mais ces deux champs sont essentiels pour Phantombuster) :
     ```json
     {
       "phantombusterApiKey": "VOTRE_CLE_API_PHANTOMBUSTER",
       "phantombusterAgentId": "VOTRE_ID_AGENT_PHANTOMBUSTER"
     }
     ```
   - Obtenez votre clé API Phantombuster depuis votre compte Phantombuster (Settings > API Key).
   - Obtenez l'ID de votre agent Phantombuster (l'ID se trouve dans l'URL de la page de votre agent).
   - Le fichier `config.json` contient des valeurs par défaut pour les paramètres envoyés à l'agent Phantombuster. Vous pouvez l'ajuster si besoin, mais les valeurs entrées dans l'interface web remplaceront celles-ci lors d'un lancement.

## Configuration de l'Agent Phantombuster
Assurez-vous que votre agent Phantombuster est configuré pour:
- Lire les URLs de profils et optionnellement les messages depuis une Google Sheet en utilisant les noms de colonnes spécifiés.
- Utiliser le cookie de session LinkedIn (`li_at`).
- Gérer le nombre de profils par lancement (`profilesPerLaunch`).

## Utilisation

1. Démarrez le serveur local :
```bash
npm start
```

2. Ouvrez votre navigateur à l'adresse : `http://localhost:3000`

3. Remplissez les champs requis dans l'interface web (URL Google Sheets, Cookie LinkedIn, Message, Nom de la colonne URLs, etc.). Ces informations seront transmises à votre agent Phantombuster.

4. Cliquez sur le bouton "Lancer l'envoi via Phantombuster".

5. Le statut et la progression s'afficheront dans l'interface web, relayant les informations du script local qui communique avec l'API Phantombuster.

## Fichiers Clés
- `index.html` : Interface utilisateur web.
- `server.js` : Serveur Express gérant les requêtes de l'interface et lançant le script d'envoi.
- `linkedin_message_sender.js` : Script Node.js qui lit la configuration et appelle l'API Phantombuster.
- `credentials.json` : Stocke la clé API Phantombuster et l'ID de l'agent (gardé localement).
- `config.json` : Fichier de configuration par défaut (les paramètres de l'interface ont priorité).
- `package.json` : Gère les dépendances Node.js.
- `linkedin_sender.log` : Fichier de log.
- `temp_config.json` : Fichier temporaire créé par `server.js` pour passer la config au script d'envoi (automatiquement supprimé).
- `check_setup.js` : Script de vérification (potentiellement obsolète dans cette version simplifiée, peut être supprimé ou révisé si nécessaire).

## Sécurité
- Votre clé API Phantombuster et vos identifiants sensibles sont stockés localement dans `credentials.json`.
- Ne partagez jamais votre fichier `credentials.json`.

## Limitations
- Dépend de la configuration et du bon fonctionnement de votre agent Phantombuster.
- Le suivi détaillé du processus (profil par profil) dépend de ce que votre agent Phantombuster renvoie via l'API et de la manière dont le script `linkedin_message_sender.js` gère ces retours.

## Dépannage
- **Erreurs de démarrage du serveur:** Vérifiez que `linkedin_message_sender.js` et `credentials.json` existent à la racine du projet et que `npm install` a été exécuté.
- **Erreurs lors du lancement via l'interface:** Vérifiez les logs dans la console du serveur (`npm start`) et les messages affichés dans la zone de statut de l'interface. Vérifiez également la configuration de votre agent Phantombuster et la validité de votre clé API.

## Support
Consultez les logs dans la console et le fichier `linkedin_sender.log`. Pour des problèmes liés à l'agent Phantombuster lui-même, consultez la documentation ou le support de Phantombuster.

## Licence
Ce projet est sous licence MIT. 