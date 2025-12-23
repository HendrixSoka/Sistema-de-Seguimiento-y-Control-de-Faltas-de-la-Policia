// Sidebar.jsx
import { Box, VStack, Button } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserDataFromToken } from "../api/auth";

export default function Sidebar() {
  const userRole = getUserDataFromToken()?.rol || "User";
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Inicio", path: "/home" },
    { label: "Faltas Leves", path: "/faltas-leves" },
    { label: "Faltas Graves", path: "/faltas-graves" },
    { label: "Delitos", path: "/delitos" },
    { label: "Estadísticas", path: "/Estadisticas" },
  ];

  const supervisorItems = [
    { label: "Gestionar Usuarios", path: "/usuarios" },
    { label: "Historial de Cambios", path: "/historial" },
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
        {[...menuItems, ...(userRole === "Supervisor" ? supervisorItems : [])].map(
          (item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.label}
                onClick={() => navigate(item.path)}
                bg={isActive ? "#2B6CB0" : "white"} 
                color={isActive ? "white" : "#2F6B2E"}
                _hover={{
                  bg: isActive ? "#2C5282" : "#e6f2e6",
                }}
                justifyContent="flex-start"
                fontWeight="semibold"
                borderRadius="lg"
                transition="all 0.15s"
              >
                {item.label}
              </Button>
            );
          }
        )}
      </VStack>
    </Box>
  );
}
