import { Box, Flex, Badge, Text } from "@chakra-ui/react";

const actionColors = {
  crear: "green",
  modificar: "blue",
  eliminar: "red",
};

const tablaColors = {
  Faltas_Graves: "orange",
  Delitos: "red",
  Faltas_Leves: "yellow",
};

export default function TarjetaLog({ log }) {
  return (
    <Box borderWidth="1px" p={4} rounded="md" mb={3} bg="white" shadow="sm">
      <Flex justify="space-between">
        <Badge colorScheme={actionColors[log.accion]} fontSize="0.8rem">
          {log.accion.toUpperCase()}
        </Badge>

        <Badge colorScheme={tablaColors[log.tabla_afectada]}>
          {log.tabla_afectada}
        </Badge>
      </Flex>

      <Text mt={2} fontSize="0.9rem">
        <strong>ID Registro:</strong> {log.id_registro}
      </Text>

      <Text fontSize="0.9rem">
        <strong>Fecha:</strong> {new Date(log.fecha).toLocaleString()}
      </Text>

      {log.cambios && (
        <Text mt={2} fontSize="0.85rem" opacity={0.8}>
          {log.cambios}
        </Text>
      )}
    </Box>
  );
}
