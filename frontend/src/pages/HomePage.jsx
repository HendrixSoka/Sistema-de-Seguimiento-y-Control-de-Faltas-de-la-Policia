import React from "react";
import { Box, Image, Heading, Text, VStack } from "@chakra-ui/react";
import Logo from '../assets/Logo.png';

export default function HomePage() {
  return (
    <Box p={8} h="100%">
      <VStack
        h="100%"
        spacing={6}
        justify="center"
        align="center"
        textAlign="center"
      >
        <Image
          src={Logo}
          alt="Sistema de Control y Seguimiento"
          maxH="220px"
          objectFit="contain"
        />

        <Heading size="lg" color="white">
          Bienvenido al Sistema de Información de Control y Seguimiento de
          Faltas Leves, Faltas Graves y Delitos
        </Heading>

        <Text fontSize="md" color="gray.200" maxW="900px">
          Este sistema permite el registro, control y seguimiento integral de
          faltas leves, faltas graves y delitos, facilitando la gestión
          administrativa y el monitoreo oportuno de cada caso.
        </Text>

        <Text fontSize="md" color="gray.100" maxW="900px">
          Asimismo, ofrece herramientas de seguimiento especializado para las
          faltas graves, incorporando alertas y avisos por tiempo que permiten
          dar cumplimiento a los plazos establecidos, mejorar la trazabilidad
          de los procesos y fortalecer la toma de decisiones.
        </Text>
      </VStack>
    </Box>
  );
}
