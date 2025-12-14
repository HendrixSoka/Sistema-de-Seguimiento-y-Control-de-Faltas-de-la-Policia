import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Heading,
} from "@chakra-ui/react";

export default function ContFaltaGrave({ data }) {
  console.log("ContFaltaGrave data:", data);
  const columnas = [
    { label: "SUBSANACIÓN DE DENUNCIA (DIDIPI)", rowSpan: 2 },
    { label: "DESESTIMACIÓN (FISCALIA)", rowSpan: 2 },
    { label: "EN PROCESO DE INVESTIGACIÓN (DIDIPI)", rowSpan: 2 },
    { label: "RECHAZO DE DENUNCIA  (FISCALÍA)", rowSpan: 2 },
    { label: "CON ACUSACIÓN FISCAL (REMITIDO AL TDD)", rowSpan: 2 },

    {
      label: "EN PROCESO ORAL (TDD)",
      colSpan: 8,
      subcolumnas: [
        "AUTO DE APERTURA",
        "ALEGATOS INICIALES",
        "INTERROGATORIO PROCESADO(A)",
        "PRESENTACIÓN DE PRUEBAS DE CARGO",
        "PRESENTACIÓN DE PRUEBAS DE DESCARGO",
        "ALEGATOS FINALES",
        "DELIBERACIÓN Y LECTURA DE RESOLUCIÓN",
        "NOTIFICACIÓN CON LA RESOLUCIÓN DE 1º INSTANCIA",
      ],
    },

    {
      label: "SANCIONES",
      colSpan: 5,
      subcolumnas: [
        "RETIRO TEMPORAL (1-2 AÑOS)",
        "BAJA DEFINITIVA",
        "RESOLUCIÓN ABSOLUTORIA",
        "EXTINCIÓN POR PRESCRIPCIÓN",
        "EXTINCIÓN POR COSA JUZGADA",
      ],
    },
  ];

  const etapaMap = {
    "FECHA SUBSANACION (DIDIPI)": "SUBSANACIÓN DE DENUNCIA (DIDIPI)",
    "FECHA DESESTIMACION (FISCALIA)": "DESESTIMACIÓN (FISCALIA)",
    "FECHA INVESTIGACION (DIDIPI)": "EN PROCESO DE INVESTIGACIÓN (DIDIPI)",
    "FECHA RECHAZO DE DENUNCIA (FISCALIA)": "RECHAZO DE DENUNCIA (FISCALÍA)",
    "FECHA ACUSACION FISCAL (TDD)": "CON ACUSACIÓN FISCAL (REMITIDO AL TDD)",
    // agrega los demás
  };
  // Convertir el array en { etapa: cantidad }
  const cantidades = Object.fromEntries(
    data.map((d) => {
      const keyOriginal = d.nombre_etapa.trim();
      const keyFinal = etapaMap[keyOriginal] || keyOriginal; // fallback
      return [keyFinal, d.cantidad];
    })
  );

  // Grupos
  const grupo1 = columnas.slice(0, 5).map((c) => c.label);
  const grupo2 = columnas[5].subcolumnas;
  const grupo3 = [
    "RETIRO TEMPORAL (1-2 AÑOS)",
    "BAJA DEFINITIVA",
    "RESOLUCIÓN ABSOLUTORIA",
    "EXTINCIÓN POR PRESCRIPCIÓN",
    "EXTINCIÓN POR COSA JUZGADA",
  ];

  const sumarGrupo = (etapas) =>
    etapas.reduce((acc, e) => acc + (cantidades[e] || 0), 0);

  const totalGrupo1 = sumarGrupo(grupo1);
  const totalGrupo2 = sumarGrupo(grupo2);
  const totalGrupo3 = sumarGrupo(grupo3);

  const totalGeneral = totalGrupo1 + totalGrupo2 + totalGrupo3;

  return (
    <Box p={5}>
      <Heading size="lg" mb={4} color="white">
        Demostración Numérica Sobre Faltas Graves
      </Heading>

      <TableContainer borderWidth="1px" rounded="md">
        <Table variant="simple" size="sm" bg="white">
          <Thead bg="blue.600">
            <Tr>
              {columnas.map((col, idx) => (
                <Th
                  key={idx}
                  colSpan={col.colSpan || 1}
                  rowSpan={col.rowSpan || 1}
                  color="white"
                  textAlign="center"
                  whiteSpace="normal"
                  wordBreak="break-word"
                  maxW="150px"
                  
                >
                  {col.label}
                </Th>
              ))}
            </Tr>

            <Tr>
              {columnas.map((col, idx) =>
                col.subcolumnas
                  ? col.subcolumnas.map((sub, subIdx) => (
                      <Th
                        key={`${idx}-${subIdx}`}
                        textAlign="center"
                        bg="blue.400"
                        color="white"
                        whiteSpace="normal"
                        wordBreak="break-word"
                        maxW="150px"
                      >
                        {sub}
                      </Th>
                    ))
                  : null
              )}
            </Tr>
          </Thead>

          <Tbody>
            <Tr>
              {columnas.map((col, idx) => {
                if (!col.subcolumnas) {
                  return (
                    <Td
                      key={idx}
                      textAlign="center"
                      whiteSpace="normal"
                      wordBreak="break-word"
                      maxW="150px"
                    >
                      {cantidades[col.label] || 0}
                    </Td>
                  );
                }

                return col.subcolumnas.map((sub, subIdx) => (
                  <Td
                    key={`${idx}-${subIdx}`}
                    textAlign="center"
                    whiteSpace="normal"
                    wordBreak="break-word"
                    maxW="150px"
                  >
                    {cantidades[sub] || 0}
                  </Td>
                ));
              })}
            </Tr>

            <Tr bg="gray.50" fontWeight="bold">
              <Td colSpan={5} textAlign="center">
                {totalGrupo1}
              </Td>

              <Td colSpan={8} textAlign="center">
                {totalGrupo2}
              </Td>

              <Td colSpan={6} textAlign="center">
                {totalGrupo3}
              </Td>
            </Tr>

            <Tr bg="gray.100" fontWeight="bold">
              <Td colSpan={5 + 8 + 6} textAlign="center">
                TOTAL: {totalGeneral}
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
