# Utiliser une image Node.js LTS comme base
FROM node:lts

# Installer les dépendances système nécessaires pour Puppeteer
# Utilise apt-get pour les systèmes basés sur Debian/Ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium-browser \
    chromium-browser-l10n \
    chromium-codecs-ffmpeg-extra \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage3 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxkbcommon0 \
    libxshmfence6 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/* # Nettoyer les caches apt

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json pour installer les dépendances Node.js
# Cette étape est faite séparément pour optimiser le cache Docker
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm install

# Copier le reste du code source de l'application
COPY . .

# Exposer le port sur lequel l'application écoute
EXPOSE 3000

# Commande pour démarrer l'application lorsque le conteneur est lancé
CMD [ "npm", "start" ] 