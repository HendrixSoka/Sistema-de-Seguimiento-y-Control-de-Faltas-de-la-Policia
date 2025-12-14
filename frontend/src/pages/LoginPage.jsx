import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginUser, getUserDataFromToken } from '../api/auth';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
} from '@chakra-ui/react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [secret_name, setSecret_name] = useState('');
  const toast = useToast();

  useEffect(() => {
    const userData = getUserDataFromToken();
    if (userData) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogin = () => {
    if (!username || !secret_name) {
      toast({
        title: "Por favor ingresa tu usuario y contraseña",
        status: "warning",
        duration: 2500,
        isClosable: true,
        variant: "subtle",
      });
      return;
    }

    loginUser(username, secret_name)
      .then(() => {
        toast({
          title: "¡Logueado con éxito!",
          status: "success",
          duration: 2000,
          isClosable: true,
          variant: "subtle",
          onCloseComplete: () => navigate("/home"),
        });
      })
      .catch(() => {
        toast({
          title: "Usuario o contraseña incorrectos",
          status: "error",
          duration: 3000,
          isClosable: true,
          variant: "subtle",
        });
      });
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="#5c8457ff"
      px={4}
    >
      <Stack
        spacing={6}
        w="100%"
        maxW="400px"
        p={6}
        bg="white"
        borderRadius="md"
        boxShadow="lg"
      >
        <Heading size="lg" color="#20471fff" textAlign="center">
          Te damos la bienvenida
        </Heading>

        <FormControl>
          <FormLabel color="#20471fff" fontWeight="medium">
            Usuario
          </FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: juan.perez"
            focusBorderColor="#60AD58"
            bg="white"
            borderRadius="md"
          />
        </FormControl>

        <FormControl>
          <FormLabel color="#20471fff" fontWeight="medium">
            Contraseña
          </FormLabel>
          <Input
            type="password"
            value={secret_name}
            onChange={(e) => setSecret_name(e.target.value)}
            placeholder="********"
            focusBorderColor="#60AD58"
            bg="white"
            borderRadius="md"
          />
        </FormControl>

        <Button
          bg="#60AD58"
          color="white"
          _hover={{ bg: '#4e8e4a' }}
          _active={{ bg: '#3b6f38' }}
          onClick={handleLogin}
        >
          Iniciar Sesión
        </Button>
      </Stack>
    </Box>
  );
}
