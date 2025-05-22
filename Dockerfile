FROM ghcr.io/puppeteer/puppeteer:latest

# Changer l'utilisateur pour pptruser avant de définir le répertoire de travail
USER pptruser

# Définir le répertoire de travail dans le conteneur
WORKDIR /home/pptruser/app

# Copier les fichiers package.json et package-lock.json pour installer les dépendances Node.js
# Cette étape est faite séparément pour optimiser le cache Docker
COPY package*.json ./

# S'assurer que pptruser est propriétaire des fichiers avant npm install
RUN sudo chown -R pptruser:pptruser /home/pptruser/app

# Installer les dépendances Node.js en contournant les erreurs de permission (si nécessaire)
RUN npm install --unsafe-perm

# Copier le reste du code source de l'application
COPY . ./

# Exposer le port sur lequel l'application écoute
EXPOSE 3000

# Commande pour démarrer l'application lorsque le conteneur est lancé
CMD [ "npm", "start" ]