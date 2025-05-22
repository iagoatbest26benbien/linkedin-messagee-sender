# LinkedIn Message Sender

Une application Electron avec interface React pour envoyer automatiquement des messages LinkedIn via n8n.

## 🚀 Fonctionnalités

- Interface moderne avec React et Material-UI
- Envoi automatique de messages LinkedIn
- File d'attente de messages
- Statut en temps réel des messages
- Intégration avec n8n
- Sécurisation des identifiants

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- Un compte LinkedIn
- n8n (pour l'automatisation)

## 🛠️ Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd linkedin-message-sender
```

2. Installer les dépendances :
```bash
# Installation des dépendances principales
npm install

# Installation des dépendances React
cd src/renderer
npm install
cd ../..
```

## 🚀 Développement

Pour lancer l'application en mode développement :

```bash
npm run dev
```

## 📦 Build

Pour créer l'exécutable :

```bash
npm run build
```

L'exécutable sera créé dans le dossier `dist`.

## 🔧 Configuration n8n

1. Dans n8n, créez un nouveau workflow
2. Ajoutez un nœud HTTP Request
3. Configurez-le comme suit :
   - URL : `http://localhost:3000/send-message`
   - Méthode : POST
   - Body :
   ```json
   {
     "profileUrl": "URL_DU_PROFIL_LINKEDIN",
     "message": "VOTRE_MESSAGE"
   }
   ```

## 📝 Utilisation

1. Lancez l'application
2. Entrez vos identifiants LinkedIn
3. Configurez votre workflow n8n
4. Les messages seront envoyés automatiquement

## ⚠️ Sécurité

- Les identifiants sont stockés localement
- L'application utilise l'authentification à deux facteurs si activée
- Les messages sont traités de manière séquentielle

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📧 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
