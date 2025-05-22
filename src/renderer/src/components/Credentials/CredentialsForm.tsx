import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, Alert } from '@mui/material';
import { LinkedInCredentials } from '../../../shared/types';

interface CredentialsFormProps {
  onSave: (credentials: LinkedInCredentials) => Promise<void>;
}

const CredentialsForm: React.FC<CredentialsFormProps> = ({ onSave }) => {
  const [credentials, setCredentials] = useState<LinkedInCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await onSave(credentials);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Identifiants LinkedIn
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Mot de passe"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Identifiants sauvegardés avec succès</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CredentialsForm; 