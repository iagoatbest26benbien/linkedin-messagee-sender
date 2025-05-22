import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { addMessage } from '../store/slices/queueSlice';
import { useNotification } from '../hooks/useNotification';

interface MessageFormProps {
  open: boolean;
  onClose: () => void;
}

export const MessageForm: React.FC<MessageFormProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const [formData, setFormData] = React.useState({
    recipientUrl: '',
    content: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(addMessage(formData));
      showNotification('Message ajouté à la file d\'attente', 'success');
      onClose();
      setFormData({ recipientUrl: '', content: '' });
    } catch (error) {
      showNotification('Erreur lors de l\'ajout du message', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter un message</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="URL du profil LinkedIn"
              name="recipientUrl"
              value={formData.recipientUrl}
              onChange={handleChange}
              required
              helperText="Ex: https://www.linkedin.com/in/username"
            />
            <TextField
              fullWidth
              label="Message"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              multiline
              rows={4}
              helperText="Le message à envoyer au destinataire"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" color="primary">
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 