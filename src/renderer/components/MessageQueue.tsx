import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Delete,
  Add as AddIcon,
} from '@mui/icons-material';
import { RootState } from '../../shared/types';
import {
  startQueue,
  stopQueue,
  clearQueue,
  getMessages,
} from '../store/slices/queueSlice';
import { MessageForm } from './MessageForm';
import { useNotification } from '../hooks/useNotification';

export const MessageQueue: React.FC = () => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const { messages, status, loading, error } = useSelector(
    (state: RootState) => state.queue
  );

  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    dispatch(getMessages());
  }, [dispatch]);

  const handleStartQueue = async () => {
    try {
      await dispatch(startQueue());
      showNotification('Traitement de la file d\'attente démarré', 'success');
    } catch (error) {
      showNotification('Erreur lors du démarrage de la file d\'attente', 'error');
    }
  };

  const handleStopQueue = async () => {
    try {
      await dispatch(stopQueue());
      showNotification('Traitement de la file d\'attente arrêté', 'info');
    } catch (error) {
      showNotification('Erreur lors de l\'arrêt de la file d\'attente', 'error');
    }
  };

  const handleClearQueue = async () => {
    try {
      await dispatch(clearQueue());
      showNotification('File d\'attente vidée', 'info');
    } catch (error) {
      showNotification('Erreur lors du vidage de la file d\'attente', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">File d'attente des messages</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsFormOpen(true)}
            sx={{ mr: 1 }}
          >
            Ajouter un message
          </Button>
          <Button
            variant="contained"
            color={status.isRunning ? 'error' : 'success'}
            startIcon={status.isRunning ? <Stop /> : <PlayArrow />}
            onClick={status.isRunning ? handleStopQueue : handleStartQueue}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {status.isRunning ? 'Arrêter' : 'Démarrer'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleClearQueue}
            disabled={loading || messages.length === 0}
          >
            Vider
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Destinataire</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.recipientUrl}</TableCell>
                <TableCell>{message.content}</TableCell>
                <TableCell>
                  <Typography
                    color={
                      message.status === 'sent'
                        ? 'success.main'
                        : message.status === 'failed'
                        ? 'error.main'
                        : 'text.primary'
                    }
                  >
                    {message.status}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(message.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {message.error && (
                    <Typography color="error" variant="caption">
                      {message.error}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun message dans la file d'attente
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <MessageForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </Box>
  );
}; 