import React from 'react';
import Navbar from './Navbar';
import { Box, Container } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
        }}
      >
        <Container maxWidth="sm">
          <Box textAlign="center">
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              Xpense
            </Box>{' '}
            - Student Finance Management with Blockchain Rewards
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;