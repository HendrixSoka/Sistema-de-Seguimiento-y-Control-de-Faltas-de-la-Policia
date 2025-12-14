// Sidebar.jsx
import { Box, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getUserDataFromToken } from '../api/auth';
export default function Sidebar() {
  const userRole = (getUserDataFromToken()?.rol) || 'User';
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Faltas Leves', path: '/faltas-leves' },
    { label: 'Faltas Graves', path: '/faltas-graves' },
    { label: 'Delitos', path: '/delitos' },
    { label: 'Estadisticas', path: '/home' },
  ];

  const supervisorItems = [
    { label: 'Gestionar Usuarios', path: '/usuarios' },
    { label: 'Historial de Cambios', path: '/historial' },
  ];

  return (
    <Box
      bg="#2F6B2E"
      w="240px"
      minH="100vh"
      p={4}
      color="white"
      boxShadow="md"
    >
      <VStack spacing={3} align="stretch">
        {[...menuItems, ...(userRole === 'Supervisor' ? supervisorItems : [])].map((item) => (
          <Button
            key={item.label}
            onClick={() => navigate(item.path)}
            bg="white"
            color="#2F6B2E" 
            _hover={{ bg: '#e6f2e6', transform: 'scale(1.03)' }}
            _active={{ bg: '#d6ead6' }}
            justifyContent="flex-start"
            fontWeight="semibold"
            borderRadius="lg"
            transition="all 0.15s"
          >
            {item.label}
          </Button>
        ))}
      </VStack>
    </Box>
  );
}
