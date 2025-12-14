import { Box, Flex, Image, Text, Button } from "@chakra-ui/react";
import { getUserDataFromToken } from '../api/auth';
import Logo from '../assets/Logo.png';
export default function Header({ onLogout }) {
    const userData = getUserDataFromToken() || { nombre: 'Invitado', cargo: 'N/A' };
    const btnTextColor = "#4B8E48";

    return (
        <Flex
            as="header"
            align="center"
            justify="space-between"
            padding="4"
            bg="#2F6B2E" 
            boxShadow="md"
            minW={"100%"}
            w ={"100%"}
        >
            <Flex align="center">
            <Image
                src={Logo}
                alt="Logo"
                boxSize="60px"
                objectFit="cover"
                borderRadius="md"
            />

            <Box ml="4">
                <Text fontSize="xl" fontWeight="bold" color="white">
                Sistema de Control y Faltas
                </Text>
                <Text fontSize="md" color="whiteAlpha.800">
                Departamento de Procesos Penales Administrativos
                </Text>
                <Text fontSize="sm" mt="1" fontWeight="medium" color="white">
                Usuario: {userData.nombre} ({userData.cargo})
                </Text>
            </Box>
            </Flex>

            <Button
            onClick={onLogout}
            bg="white"
            color={btnTextColor}
            px={4}
            py={2}
            rounded="2xl"
            _hover={{ bg: "#f0f0f0" }}
            _active={{ bg: "#e0e0e0" }}
            >
            Cerrar sesión
            </Button>
        </Flex>
    );
}
