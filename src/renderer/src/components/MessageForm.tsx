import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { RootState } from '../store';
import { addMessage } from '../store/slices/queueSlice';
import { showSnackbar } from '../store/slices/uiSlice';

const MessageForm: React.FC = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.queue);
  const [formData, setFormData] = useState({
    recipientUrl: '',
    content: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(addMessage(formData)).unwrap();
      setFormData({ recipientUrl: '', content: '' });
      dispatch(showSnackbar({ message: 'Message ajouté à la file d\'attente', severity: 'success' }));
    } catch (error) {
      dispatch(showSnackbar({ message: 'Erreur lors de l\'ajout du message', severity: 'error' }));
    }
  };

  return (
    <Card>
      <CardHeader title="Nouveau Message" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => dispatch({ type: 'queue/clearError' })}>
                {error}
              </Alert>
            )}
            <TextField
              label="URL du profil LinkedIn"
              name="recipientUrl"
              value={formData.recipientUrl}
              onChange={handleChange}
              required
              fullWidth
              placeholder="https://www.linkedin.com/in/username"
            />
            <TextField
              label="Message"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={4}
              placeholder="Votre message ici..."
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ alignSelf: 'flex-end' }}
            >
              {loading ? 'Ajout...' : 'Ajouter à la file d\'attente'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default MessageForm; 