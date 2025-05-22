import { configureStore } from '@reduxjs/toolkit';
import credentialsReducer from './slices/credentialsSlice';
import queueReducer from './slices/queueSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    credentials: credentialsReducer,
    queue: queueReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 