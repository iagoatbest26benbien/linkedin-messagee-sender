import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LinkedInCredentials } from '../../../shared/types';
import { ipcRenderer } from 'electron';

interface CredentialsState {
  credentials: LinkedInCredentials | null;
  loading: boolean;
  error: string | null;
}

const initialState: CredentialsState = {
  credentials: null,
  loading: false,
  error: null,
};

export const getCredentials = createAsyncThunk(
  'credentials/getCredentials',
  async () => {
    const credentials = await ipcRenderer.invoke('get-credentials');
    return credentials;
  }
);

export const saveCredentials = createAsyncThunk(
  'credentials/saveCredentials',
  async (credentials: LinkedInCredentials) => {
    await ipcRenderer.invoke('save-credentials', credentials);
    return credentials;
  }
);

const credentialsSlice = createSlice({
  name: 'credentials',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCredentials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCredentials.fulfilled, (state, action) => {
        state.loading = false;
        state.credentials = action.payload;
      })
      .addCase(getCredentials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors de la récupération des identifiants';
      })
      .addCase(saveCredentials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveCredentials.fulfilled, (state, action) => {
        state.loading = false;
        state.credentials = action.payload;
      })
      .addCase(saveCredentials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors de la sauvegarde des identifiants';
      });
  },
});

export default credentialsSlice.reducer; 