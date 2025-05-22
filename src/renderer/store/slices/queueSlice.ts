import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Message, QueueStatus } from '../../../shared/types';
import { ipcRenderer } from 'electron';

interface QueueState {
  messages: Message[];
  status: QueueStatus;
  loading: boolean;
  error: string | null;
}

const initialState: QueueState = {
  messages: [],
  status: {
    isRunning: false,
    queueLength: 0,
    processedCount: 0,
    failedCount: 0,
    lastProcessed: null,
  },
  loading: false,
  error: null,
};

export const getMessages = createAsyncThunk('queue/getMessages', async () => {
  const messages = await ipcRenderer.invoke('get-messages');
  return messages;
});

export const addMessage = createAsyncThunk(
  'queue/addMessage',
  async (message: Omit<Message, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const newMessage = await ipcRenderer.invoke('add-message', message);
    return newMessage;
  }
);

export const clearQueue = createAsyncThunk('queue/clearQueue', async () => {
  await ipcRenderer.invoke('clear-queue');
});

export const startQueue = createAsyncThunk('queue/startQueue', async () => {
  await ipcRenderer.invoke('start-queue');
});

export const stopQueue = createAsyncThunk('queue/stopQueue', async () => {
  await ipcRenderer.invoke('stop-queue');
});

export const getQueueStatus = createAsyncThunk('queue/getQueueStatus', async () => {
  const status = await ipcRenderer.invoke('get-queue-status');
  return status;
});

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // getMessages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors de la récupération des messages';
      })
      // addMessage
      .addCase(addMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(addMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors de l\'ajout du message';
      })
      // clearQueue
      .addCase(clearQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearQueue.fulfilled, (state) => {
        state.loading = false;
        state.messages = [];
      })
      .addCase(clearQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du vidage de la file d\'attente';
      })
      // startQueue
      .addCase(startQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startQueue.fulfilled, (state) => {
        state.loading = false;
        state.status.isRunning = true;
      })
      .addCase(startQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du démarrage de la file d\'attente';
      })
      // stopQueue
      .addCase(stopQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopQueue.fulfilled, (state) => {
        state.loading = false;
        state.status.isRunning = false;
      })
      .addCase(stopQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors de l\'arrêt de la file d\'attente';
      })
      // getQueueStatus
      .addCase(getQueueStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQueueStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(getQueueStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors de la récupération du statut';
      });
  },
});

export default queueSlice.reducer; 