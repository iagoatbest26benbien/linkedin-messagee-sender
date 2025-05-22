import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Container } from '@mui/material';
import Layout from './components/Layout';
import CredentialsForm from './components/CredentialsForm';
import MessageForm from './components/MessageForm';
import MessageQueue from './components/MessageQueue';
import Snackbar from './components/Snackbar';
import { getCredentials } from './store/slices/credentialsSlice';
import { getMessages, getQueueStatus } from './store/slices/queueSlice';

const App: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Charger les données initiales
    dispatch(getCredentials());
    dispatch(getMessages());
    dispatch(getQueueStatus());

    // Mettre à jour le statut de la file d'attente toutes les 5 secondes
    const interval = setInterval(() => {
      dispatch(getQueueStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <CredentialsForm />
          <Box sx={{ mt: 4 }}>
            <MessageForm />
          </Box>
          <Box sx={{ mt: 4 }}>
            <MessageQueue />
          </Box>
        </Box>
      </Container>
      <Snackbar />
    </Layout>
  );
};

export default App; 