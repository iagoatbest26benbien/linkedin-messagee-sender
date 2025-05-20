document.getElementById('sendForm').addEventListener('submit', async function(event) {
  event.preventDefault(); // Prevent default form submission

  const form = event.target;
  const formData = new FormData(form);
  const jsonData = {};

  formData.forEach((value, key) => {
    jsonData[key] = value;
  });

  const responseDiv = document.getElementById('response');
  const statusDiv = document.getElementById('status');
  const progress = document.getElementById('progress');
  const progressLabel = document.getElementById('progress-label');
  const submitButton = form.querySelector('button[type="submit"]');

  // Clear previous messages and reset UI
  responseDiv.innerHTML = '';
  responseDiv.className = '';
  statusDiv.innerHTML = 'Connexion au serveur...';
  progress.style.width = '0%';
  progressLabel.textContent = '0%';
  submitButton.disabled = true;

  let eventSource = null;

  // Function to update status messages
  function updateStatus(message, isError = false) {
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.style.color = isError ? 'red' : '#333';
      statusDiv.appendChild(messageElement);
      statusDiv.scrollTop = statusDiv.scrollHeight; // Auto-scroll to bottom
  }

  // Function to update progress bar
  function updateProgress(percentage) {
      const roundedPercentage = Math.max(0, Math.min(100, Math.round(percentage))); // Ensure percentage is between 0 and 100
      progress.style.width = `${roundedPercentage}%`;
      progressLabel.textContent = `${roundedPercentage}%`;
      // You might want to change progress bar color on error/completion here
  }

  try {
    // 1. Establish SSE connection first
    updateStatus('Établissement de la connexion de suivi...');
    eventSource = new EventSource('/status-stream');

    eventSource.onmessage = function(event) {
        // Handle generic messages (can be used for simple status updates)
        console.log('SSE message:', event.data);
        updateStatus(`[Message Serveur] ${event.data}`);
    };

    eventSource.addEventListener('status', function(event) {
        // Handle custom 'status' events
        console.log('SSE Status:', event.data);
        updateStatus(event.data);
    });

    eventSource.addEventListener('progress', function(event) {
        // Handle custom 'progress' events
        console.log('SSE Progress:', event.data);
        const percentage = parseInt(event.data, 10);
        if (!isNaN(percentage)) {
            updateProgress(percentage);
        }
    });

    eventSource.addEventListener('error', function(event) {
        // Handle errors from the stream
        console.error('SSE Error:', event);
        updateStatus('Erreur de connexion au suivi ou erreur du serveur.', true);
        responseDiv.innerHTML = 'Erreur lors de la communication avec le serveur.';
        responseDiv.className = 'error';
        submitButton.disabled = false;
        if (eventSource) eventSource.close();
    });

     eventSource.addEventListener('complete', function(event) {
        // Handle completion event
        console.log('SSE Complete:', event.data);
        updateStatus('Processus terminé.', event.data.toLowerCase().includes('erreur'));
        responseDiv.innerHTML = event.data.toLowerCase().includes('erreur') ? 'Terminé avec erreurs.' : 'Opération terminée avec succès.';
        responseDiv.className = event.data.toLowerCase().includes('erreur') ? 'error' : 'success';
        submitButton.disabled = false;
        if (eventSource) eventSource.close();
    });

    eventSource.onopen = async function(event) {
        console.log('SSE connection established.');
        updateStatus('Connexion établie. Déclenchement du workflow...');
        // 2. Once SSE is connected, send the form data to trigger the workflow
        try {
            const response = await fetch('/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(jsonData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                 // If fetch fails, the SSE 'error' event might not fire, handle here
                 updateStatus(`Erreur serveur lors du déclenchement: ${response.status} - ${errorText}`, true);
                 responseDiv.innerHTML = `Erreur lors du déclenchement du workflow: ${response.status} - ${errorText}`;
                 responseDiv.className = 'error';
                 submitButton.disabled = false;
                 if (eventSource) eventSource.close();
            } else {
                // If fetch is successful, status updates will come via SSE
                 console.log('/send endpoint successfully called.');
                 // The 'complete' event from SSE will handle re-enabling the button and final message
            }
        } catch (fetchError) {
            console.error('Fetch error triggering workflow:', fetchError);
             updateStatus(`Erreur réseau lors du déclenchement: ${fetchError.message}`, true);
             responseDiv.innerHTML = `Erreur réseau: ${fetchError.message}`;
             responseDiv.className = 'error';
             submitButton.disabled = false;
             if (eventSource) eventSource.close();
        }
    };


  } catch (error) {
    console.error('Error setting up SSE or initial fetch:', error);
    updateStatus('Une erreur inattendue est survenue.', true);
    responseDiv.innerHTML = 'Erreur critique lors du démarrage.';
    responseDiv.className = 'error';
    submitButton.disabled = false;
    if (eventSource) eventSource.close(); // Ensure connection is closed on critical error
  }
}); 