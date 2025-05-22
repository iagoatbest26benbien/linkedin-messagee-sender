import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LinkedInCredentials } from '../../../shared/types';

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
    const credentials = await window.electron.ipcRenderer.invoke('get-credentials');
    return credentials;
  }
);

export const saveCredentials = createAsyncThunk(
  'credentials/saveCredentials',
  async (credentials: LinkedInCredentials) => {
    await window.electron.ipcRenderer.invoke('save-credentials', credentials);
    return credentials;
  }
);

const credentialsSlice = createSlice({
  name: 'credentials',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
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

export const { clearError } = credentialsSlice.actions;
export default credentialsSlice.reducer; 