import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import { Message, MessageStatus, QueueStatus } from '../../../shared/types';

interface MessageQueueProps {
  onStartQueue: () => Promise<void>;
  onStopQueue: () => Promise<void>;
  onGetStatus: () => Promise<QueueStatus>;
  onGetMessages: () => Promise<Message[]>;
}

const MessageQueue: React.FC<MessageQueueProps> = ({
  onStartQueue,
  onStopQueue,
  onGetStatus,
  onGetMessages
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<QueueStatus>({
    isRunning: false,
    queueLength: 0,
    processedCount: 0,
    failedCount: 0
  });
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [newStatus, newMessages] = await Promise.all([
        onGetStatus(),
        onGetMessages()
      ]);
      setStatus(newStatus);
      setMessages(newMessages);
    } catch (error) {
      console.error('Error fetching queue data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleQueue = async () => {
    setLoading(true);
    try {
      if (status.isRunning) {
        await onStopQueue();
      } else {
        await onStartQueue();
      }
      await fetchData();
    } catch (error) {
      console.error('Error toggling queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.SENT:
        return 'success';
      case MessageStatus.FAILED:
        return 'error';
      case MessageStatus.SENDING:
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">File d'attente des messages</Typography>
        <Button
          variant="contained"
          color={status.isRunning ? 'error' : 'primary'}
          onClick={handleToggleQueue}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : status.isRunning ? (
            'Arrêter'
          ) : (
            'Démarrer'
          )}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip
          label={`En attente: ${status.queueLength}`}
          color="default"
        />
        <Chip
          label={`Envoyés: ${status.processedCount}`}
          color="success"
        />
        <Chip
          label={`Échoués: ${status.failedCount}`}
          color="error"
        />
      </Box>

      <List>
        {messages.map((message) => (
          <ListItem
            key={message.id}
            divider
            sx={{
              opacity: message.status === MessageStatus.SENT ? 0.7 : 1
            }}
          >
            <ListItemText
              primary={message.recipientUrl}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {message.content}
                  </Typography>
                  <br />
                  {message.error && (
                    <Typography component="span" variant="body2" color="error">
                      Erreur: {message.error}
                    </Typography>
                  )}
                </>
              }
            />
            <Chip
              label={message.status}
              color={getStatusColor(message.status) as any}
              size="small"
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default MessageQueue; 