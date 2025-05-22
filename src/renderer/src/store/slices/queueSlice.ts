import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Message, QueueStatus } from '../../../shared/types';

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
  },
  loading: false,
  error: null,
};

export const getMessages = createAsyncThunk(
  'queue/getMessages',
  async () => {
    const messages = await window.electron.ipcRenderer.invoke('get-messages');
    return messages;
  }
);

export const addMessage = createAsyncThunk(
  'queue/addMessage',
  async (message: Omit<Message, 'id' | 'status' | 'createdAt'>) => {
    const newMessage = await window.electron.ipcRenderer.invoke('add-message', message);
    return newMessage;
  }
);

export const clearQueue = createAsyncThunk(
  'queue/clearQueue',
  async () => {
    await window.electron.ipcRenderer.invoke('clear-queue');
  }
);

export const startQueue = createAsyncThunk(
  'queue/startQueue',
  async () => {
    await window.electron.ipcRenderer.invoke('start-queue');
  }
);

export const stopQueue = createAsyncThunk(
  'queue/stopQueue',
  async () => {
    await window.electron.ipcRenderer.invoke('stop-queue');
  }
);

export const getQueueStatus = createAsyncThunk(
  'queue/getQueueStatus',
  async () => {
    const status = await window.electron.ipcRenderer.invoke('get-queue-status');
    return status;
  }
);

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
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
      .addCase(clearQueue.fulfilled, (state) => {
        state.messages = [];
        state.status = initialState.status;
      })
      // startQueue
      .addCase(startQueue.fulfilled, (state) => {
        state.status.isRunning = true;
      })
      // stopQueue
      .addCase(stopQueue.fulfilled, (state) => {
        state.status.isRunning = false;
      })
      // getQueueStatus
      .addCase(getQueueStatus.fulfilled, (state, action) => {
        state.status = action.payload;
      });
  },
});

export const { clearError } = queueSlice.actions;
export default queueSlice.reducer; 