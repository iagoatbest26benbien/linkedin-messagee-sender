import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Message } from '../../../shared/types';

interface MessageFormProps {
  onAddMessage: (recipientUrl: string, content: string) => Promise<Message>;
}

const MessageForm: React.FC<MessageFormProps> = ({ onAddMessage }) => {
  const [recipientUrl, setRecipientUrl] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await onAddMessage(recipientUrl, content);
      setSuccess(true);
      setRecipientUrl('');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ajouter un message
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="URL du profil LinkedIn"
            value={recipientUrl}
            onChange={(e) => setRecipientUrl(e.target.value)}
            required
            fullWidth
            placeholder="https://www.linkedin.com/in/username"
            helperText="L'URL complète du profil LinkedIn du destinataire"
          />
          <TextField
            label="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            fullWidth
            multiline
            rows={4}
            placeholder="Votre message ici..."
          />
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Message ajouté à la file d'attente</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Ajouter à la file'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default MessageForm; 