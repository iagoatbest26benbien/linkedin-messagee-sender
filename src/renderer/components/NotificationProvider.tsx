import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { Notification } from '../../shared/types';

interface NotificationContextType {
  showNotification: (message: string, type: Notification['type']) => void;
}

export const NotificationContext = React.createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => React.useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notification, setNotification] = React.useState<Notification | null>(
    null
  );

  const showNotification = (message: string, type: Notification['type']) => {
    setNotification({
      id: Date.now().toString(),
      message,
      type,
      duration: 5000,
    });
  };

  const handleClose = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={!!notification}
        autoHideDuration={notification?.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={notification?.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}; 