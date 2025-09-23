// Complete MenuPage.tsx code for your login app
// Replace the entire handleRetailClick function with this:

import { Box, Container, Typography, Paper } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { motion, Easing } from 'framer-motion';
import { auth } from './firebase'; // Make sure this import is correct

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.3,
      duration: 0.5,
      ease: "easeOut" as Easing
    },
  }),
};

const MenuCard = ({ icon, title, index, onClick }: { icon: React.ReactNode, title: string, index: number, onClick: () => void }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover={{ scale: 1.08, boxShadow: "0px 20px 40px rgba(0,0,0,0.3)" }}
    style={{
        cursor: 'pointer',
    }}
    onClick={onClick}
  >
    <Paper
      elevation={10}
      sx={{
        width: 280,
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        color: 'white',
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ fontSize: 80 }}>
        {icon}
      </Box>
      <Typography variant="h4" component="h2">
        {title}
      </Typography>
    </Paper>
  </motion.div>
);

export default function MenuPage() {

  const handleWholesaleClick = () => {
    alert("Wholesale portal coming soon!");
  };

  const handleRetailClick = async () => {
    console.log("Retail button clicked!"); // Debug log
    
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        alert("Please log in first");
        return;
      }

      console.log("User is authenticated:", auth.currentUser.email); // Debug log

      // Get current environment
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      const phoneStoreUrl = isDevelopment 
        ? 'http://localhost:3000/dashboard'
        : 'https://phone-store-topaz.vercel.app/dashboard';

      console.log("Redirecting to:", phoneStoreUrl); // Debug log
      
      // Add a small delay to ensure the user sees the click
      setTimeout(() => {
        window.location.href = phoneStoreUrl;
      }, 100);

    } catch (error) {
      console.error("Error in handleRetailClick:", error);
      alert("Error accessing retail portal. Please try again.");
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 4,
        }}
      >
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
            <Typography variant="h2" component="h1" sx={{ color: 'white', mb: 6, fontWeight: 'bold', textShadow: '2px 2px 8px rgba(0,0,0,0.6)' }}>
                Select Your Portal
            </Typography>
        </motion.div>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 8 }}>
            <MenuCard icon={<StorefrontIcon sx={{ fontSize: 'inherit' }} />} title="Wholesale" index={1} onClick={handleWholesaleClick} />
            <MenuCard icon={<ShoppingCartIcon sx={{ fontSize: 'inherit' }} />} title="Retail" index={2} onClick={handleRetailClick} />
        </Box>
      </Box>
    </Container>
  );
}