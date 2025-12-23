import React, { useEffect, useState } from 'react';
import {
  Table, Thead, Tbody, Tr, Th, Td, Heading,
  Spinner, Box, Input, Button, HStack, Flex,
  useToast, Grid, GridItem, Text
} from '@chakra-ui/react';
import { getConteoPorPolicia } from '../api/reportService';
import {exportarTablaExcel} from '../utils/export';

export default function TablaPolicias() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [search, setSearch] = useState("");
  const [fecha_inicio, setFechaInicio] = useState(null);
  const [fecha_fin, setFechaFin] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = () => {
    setLoading(true);
    getConteoPorPolicia({ nombre: search, page, size,fecha_inicio, fecha_fin })
      .then(res => {
        setData(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect( () => {
    if(fecha_fin < fecha_inicio){
      toast({
        title: "Error de fechas",
        description: "Error la fecha inicio no puede ser mayor a la fecha fin",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [fecha_inicio, fecha_fin])

  useEffect(() => {
    fetchData();
  }, [page, search, fecha_inicio, fecha_fin]);

  const totalPages = Math.ceil(total / size);

  return (
    <Box>
      <Heading color="white" mb={4} size="md">
        Contar Registros por Policía
      </Heading>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={3}
        mb={4}
      >
        {/* Fila de labels */}
        <GridItem>
          <Text fontSize="sm" fontWeight="medium">
            Búsqueda por nombre
          </Text>
        </GridItem>

        <GridItem>
          <Text fontSize="sm" fontWeight="medium">
            Fecha inicio
          </Text>
        </GridItem>

        <GridItem>
          <Text fontSize="sm" fontWeight="medium">
            Fecha fin
          </Text>
        </GridItem>

        {/* Fila de inputs */}
        <GridItem>
          <Input
            placeholder="Buscar por nombre..."
            bg="white"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </GridItem>

        <GridItem>
          <Input
            type="date"
            bg="white"
            value={fecha_inicio || ""}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </GridItem>

        <GridItem>
          <Input
            type="date"
            bg="white"
            value={fecha_fin || ""}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </GridItem>
      </Grid>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table variant="striped" colorScheme="blue">
            <Thead >
              <Tr>
                <Th color="white">Nombre</Th>
                <Th color="white">Grado</Th>
                <Th color="white">Unidad</Th>
                <Th color="white">Delitos</Th>
                <Th color="white">Faltas Graves</Th>
                <Th color="white">Faltas Leves</Th>
              </Tr>
            </Thead>

            <Tbody bg="white">
              {data.length === 0 ? (
                <Tr><Td colSpan={6} align="center">No se encontraron datos</Td></Tr>
              ) : (
                data.map(p => (
                  <Tr key={p.id_policia}>
                    <Td>{p.nombre}</Td>
                    <Td>{p.grado}</Td>
                    <Td>{p.unidad_policial}</Td>
                    <Td>{p.total_delitos}</Td>
                    <Td>{p.total_faltas_graves}</Td>
                    <Td>{p.total_faltas_leves}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>

          {/* PAGINACION */}
          <HStack mt={4} spacing={2}>
            {[...Array(totalPages)].map((_, i) => {
              const num = i + 1;
              return (
                <Button
                  key={num}
                  size="sm"
                  colorScheme={page === num ? "blue" : "gray"}
                  onClick={() => setPage(num)}
                >
                  {num}
                </Button>
              );
            })}
          </HStack>
          <Button
            bg="white"
            color="#2F6B2E" 
            _hover={{ bg: '#e6f2e6', transform: 'scale(1.03)' }}
            _active={{ bg: '#d6ead6' }}
            justifyContent="flex-start"
            fontWeight="semibold"
            borderRadius="lg"
            transition="all 0.15s"
            onClick={() => exportarTablaExcel(data, fecha_inicio, fecha_fin)}
          >
            Exportar Excel
          </Button>
        </>
      )}
    </Box>
  );
}
