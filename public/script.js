// Récupérer les éléments du DOM
const sendForm = document.getElementById('sendForm');
const statusArea = document.getElementById('status');
const progressElement = document.getElementById('progress');
const progressLabel = document.getElementById('progress-label');
const responseArea = document.getElementById('response');

// Fonction pour mettre à jour la zone de statut
function updateStatus(message, isError = false, isComplete = false) {
    const p = document.createElement('p');
    p.textContent = message;
    if (isError) {
        p.classList.add('error-message');
    } else if (isComplete) {
        p.classList.add('complete-message');
    } else {
         p.classList.add('log-message');
    }
    statusArea.appendChild(p);
    statusArea.scrollTop = statusArea.scrollHeight; // Faire défiler vers le bas
}

// Fonction pour mettre à jour la barre de progression (si vous ajoutez cette fonctionnalité)
function updateProgress(percentage) {
    if (progressElement && progressLabel) {
        progressElement.style.width = percentage + '%';
        progressLabel.textContent = percentage + '%';
    }
}

// Écouter la soumission du formulaire
sendForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Empêcher le rechargement de la page

    updateStatus('Déclenchement du workflow n8n...');
     // Réinitialiser les zones de statut et de réponse
    statusArea.innerHTML = '';
    responseArea.innerHTML = '';
    updateProgress(0);


    const formData = new FormData(sendForm);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    console.log('Données du formulaire envoyées au serveur:', data);

    try {
        // Envoyer les données du formulaire au serveur
        const response = await fetch('/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            updateStatus('Serveur a bien reçu la demande. Vérifiez le flux de statut ci-dessous.', false, true); // Indique succès
            console.log('Réponse du serveur:', result);
             // La suite des mises à jour viendra via SSE
        } else {
            updateStatus(`Erreur lors de l'appel au serveur: ${result.error || response.statusText}`, true);
            console.error('Erreur du serveur:', result);
        }
    } catch (error) {
        updateStatus(`Erreur réseau ou inattendue lors de l'appel au serveur: ${error.message}`, true);
        console.error('Erreur fetch:', error);
    }
});

// Établir la connexion Server-Sent Events (SSE)
const eventSource = new EventSource('/status-stream');

eventSource.onmessage = (event) => {
    // Gérer les messages génériques (si utilisé)
    console.log('Message SSE générique:', event.data);
    updateStatus(`Message: ${event.data}`);
};

eventSource.onerror = (event) => {
    console.error('Erreur SSE:', event);
    updateStatus('Erreur de connexion au flux de statut. Réconnexion automatique...', true);
};

eventSource.addEventListener('status', (event) => {
     console.log('SSE Status:', event.data);
    updateStatus(`Statut: ${event.data}`);
});

eventSource.addEventListener('error', (event) => {
     console.error('SSE Error:', event.data);
    updateStatus(`Erreur: ${event.data}`, true);
});

// Gérer les événements 'complete' envoyés par le serveur
eventSource.addEventListener('complete', (event) => {
    console.log('SSE Complete:', event.data);
    try {
        const result = JSON.parse(event.data);
        if (result.success) {
            updateStatus(`Processus terminé: ${result.message}`, false, true);
            updateProgress(100); // Complète la barre si succès
        } else {
            updateStatus(`Processus terminé avec erreurs: ${result.message}`, true);
            updateProgress(100); // Complète la barre même en cas d'erreur pour indiquer la fin
        }
         // Vous pourriez vouloir fermer la connexion SSE ici si un seul processus est attendu
         // eventSource.close();
    } catch (e) {
        updateStatus(`Processus terminé avec réponse invalide: ${event.data}`, true);
        console.error('Erreur parsing complete event data:', e);
    }
});

// Gérer les événements 'messageComplete' envoyés par le serveur pour chaque message traité par Puppeteer
eventSource.addEventListener('messageComplete', (event) => {
    console.log('SSE Message Complete:', event.data);
    try {
        const result = JSON.parse(event.data);
        if (result.success) {
            updateStatus(`Message pour ${result.profileUrl} traité avec succès.`, false, true);
            // Vous pourriez incrémenter une barre de progression globale ici
        } else {
            updateStatus(`Échec du message pour ${result.profileUrl}: ${result.message}`, true);
        }
    } catch (e) {
         updateStatus(`Erreur parsing messageComplete event data: ${event.data}`, true);
        console.error('Erreur parsing messageComplete event data:', e);
    }
}); 