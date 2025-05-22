import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar as MuiSnackbar, Alert } from '@mui/material';
import { RootState } from '../store';
import { hideSnackbar } from '../store/slices/uiSlice';

const Snackbar: React.FC = () => {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state: RootState) => state.ui.snackbar);

  const handleClose = () => {
    dispatch(hideSnackbar());
  };

  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar; 