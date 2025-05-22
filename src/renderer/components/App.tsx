import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '../store';
import { theme } from '../theme';
import { Layout } from './Layout';
import { NotificationProvider } from './NotificationProvider';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <Layout />
        </NotificationProvider>
      </ThemeProvider>
    </Provider>
  );
}; 