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
import { saveCredentials } from '../store/slices/credentialsSlice';
import { showSnackbar } from '../store/slices/uiSlice';
import { LinkedInCredentials } from '../../shared/types';

const CredentialsForm: React.FC = () => {
  const dispatch = useDispatch();
  const { credentials, loading, error } = useSelector((state: RootState) => state.credentials);
  const [formData, setFormData] = useState<LinkedInCredentials>({
    email: credentials?.email || '',
    password: credentials?.password || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(saveCredentials(formData)).unwrap();
      dispatch(showSnackbar({ message: 'Identifiants sauvegardés avec succès', severity: 'success' }));
    } catch (error) {
      dispatch(showSnackbar({ message: 'Erreur lors de la sauvegarde des identifiants', severity: 'error' }));
    }
  };

  return (
    <Card>
      <CardHeader title="Identifiants LinkedIn" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => dispatch({ type: 'credentials/clearError' })}>
                {error}
              </Alert>
            )}
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ alignSelf: 'flex-end' }}
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default CredentialsForm; 