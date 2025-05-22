import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <LinkedInIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div">
            LinkedIn Message Sender
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} LinkedIn Message Sender
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 