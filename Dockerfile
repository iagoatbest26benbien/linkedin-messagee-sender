FROM ghcr.io/puppeteer/puppeteer:latest

# Changer l'utilisateur pour pptruser avant de définir le répertoire de travail
USER pptruser

# Définir le répertoire de travail dans le conteneur et s'assurer que les permissions sont correctes
WORKDIR /home/pptruser/app
RUN chown pptruser:pptruser /home/pptruser/app

# Copier les fichiers package.json et package-lock.json avec les bonnes permissions pour npm install
COPY --chown=pptruser:pptruser package*.json ./

# Installer les dépendances Node.js en contournant les erreurs de permission (si nécessaire)
RUN npm install --unsafe-perm

# Copier le reste du code source de l'application
COPY --chown=pptruser:pptruser . ./

# Exposer le port sur lequel l'application écoute
EXPOSE 3000

# Commande pour démarrer l'application lorsque le conteneur est lancé
CMD [ "npm", "start" ]