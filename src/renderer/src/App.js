import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon
} from '@mui/icons-material';

function App() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [messageQueue, setMessageQueue] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Chargement initial des données
  useEffect(() => {
    const loadCredentials = async () => {
      const result = await window.electron.invoke('get-credentials');
      if (result.success) {
        setCredentials(result.credentials || { email: '', password: '' });
      }
    };
    loadCredentials();
  }, []);

  // Gestion des messages
  useEffect(() => {
    const unsubscribeNewMessage = window.electron.on('new-message', (message) => {
      setMessageQueue(prev => [...prev, message]);
    });

    const unsubscribeStatusUpdate = window.electron.on('message-status-update', (update) => {
      setMessageQueue(prev => prev.map(msg => 
        msg.profileUrl === update.profileUrl 
          ? { ...msg, status: update.status, error: update.error }
          : msg
      ));
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeStatusUpdate();
    };
  }, []);

  // Handlers optimisés
  const handleSaveCredentials = useCallback(async () => {
    const result = await window.electron.invoke('save-credentials', credentials);
    setNotification({
      open: true,
      message: result.success 
        ? 'Identifiants sauvegardés avec succès'
        : 'Erreur lors de la sauvegarde des identifiants',
      severity: result.success ? 'success' : 'error'
    });
  }, [credentials]);

  const handleDeleteMessage = useCallback((index) => {
    setMessageQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Composants mémorisés
  const StatusIcon = useMemo(() => {
    const icons = {
      'envoyé': <CheckCircleIcon color="success" />,
      'erreur': <ErrorIcon color="error" />,
      'en attente': <PendingIcon color="action" />
    };
    return ({ status }) => icons[status] || icons['en attente'];
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          LinkedIn Message Sender
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          <TextField
            fullWidth
            label="Email LinkedIn"
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Mot de passe LinkedIn"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleSaveCredentials}
            sx={{ mt: 2 }}
          >
            Sauvegarder les identifiants
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            File d'attente des messages
          </Typography>
          <List>
            {messageQueue.map((message, index) => (
              <ListItem
                key={`${message.profileUrl}-${index}`}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteMessage(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <StatusIcon status={message.status} />
                </ListItemIcon>
                <ListItemText
                  primary={message.profileUrl}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {message.message}
                      </Typography>
                      {message.error && (
                        <Typography component="span" variant="body2" color="error">
                          {' - '}{message.error}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default App; 