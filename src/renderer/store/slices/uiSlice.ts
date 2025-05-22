import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../../shared/types';

const initialState: UIState = {
  darkMode: false,
  sidebarOpen: true,
  selectedTab: 'queue',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setSelectedTab: (state, action: PayloadAction<string>) => {
      state.selectedTab = action.payload;
    },
    addNotification: (state, action: PayloadAction<UIState['notifications'][0]>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
  },
});

export const {
  setDarkMode,
  setSidebarOpen,
  setSelectedTab,
  addNotification,
  removeNotification,
} = uiSlice.actions;

export default uiSlice.reducer; 