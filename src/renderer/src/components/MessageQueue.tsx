import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { startQueue, stopQueue, getMessages, getQueueStatus } from '../store/slices/queueSlice';
import { showSnackbar } from '../store/slices/uiSlice';
import { MessageStatus } from '../../shared/types';

const getStatusColor = (status: MessageStatus) => {
  switch (status) {
    case MessageStatus.PENDING:
      return 'warning';
    case MessageStatus.SENDING:
      return 'info';
    case MessageStatus.SENT:
      return 'success';
    case MessageStatus.FAILED:
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: MessageStatus) => {
  switch (status) {
    case MessageStatus.PENDING:
      return 'En attente';
    case MessageStatus.SENDING:
      return 'Envoi en cours';
    case MessageStatus.SENT:
      return 'Envoyé';
    case MessageStatus.FAILED:
      return 'Échec';
    default:
      return status;
  }
};

const MessageQueue: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, status, loading } = useSelector((state: RootState) => state.queue);

  const handleStartQueue = async () => {
    try {
      await dispatch(startQueue()).unwrap();
      dispatch(showSnackbar({ message: 'File d\'attente démarrée', severity: 'success' }));
    } catch (error) {
      dispatch(showSnackbar({ message: 'Erreur lors du démarrage de la file d\'attente', severity: 'error' }));
    }
  };

  const handleStopQueue = async () => {
    try {
      await dispatch(stopQueue()).unwrap();
      dispatch(showSnackbar({ message: 'File d\'attente arrêtée', severity: 'success' }));
    } catch (error) {
      dispatch(showSnackbar({ message: 'Erreur lors de l\'arrêt de la file d\'attente', severity: 'error' }));
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        dispatch(getMessages()).unwrap(),
        dispatch(getQueueStatus()).unwrap(),
      ]);
    } catch (error) {
      dispatch(showSnackbar({ message: 'Erreur lors de la mise à jour', severity: 'error' }));
    }
  };

  return (
    <Card>
      <CardHeader
        title="File d'attente des messages"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color={status.isRunning ? 'error' : 'success'}
              startIcon={status.isRunning ? <StopIcon /> : <PlayIcon />}
              onClick={status.isRunning ? handleStopQueue : handleStartQueue}
              disabled={loading}
            >
              {status.isRunning ? 'Arrêter' : 'Démarrer'}
            </Button>
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Statut de la file d'attente
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`En attente: ${status.queueLength}`}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`Envoyés: ${status.processedCount}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Échecs: ${status.failedCount}`}
              color="error"
              variant="outlined"
            />
          </Box>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>URL du destinataire</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date de création</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>{message.recipientUrl}</TableCell>
                  <TableCell>{message.content}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(message.status)}
                      color={getStatusColor(message.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(message.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {messages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Aucun message dans la file d'attente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default MessageQueue; 