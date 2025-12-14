import React, { useEffect, useState } from 'react';
import {
  Table, Thead, Tbody, Tr, Th, Td, Heading,
  Spinner, Box, Input, Button, HStack, Flex
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

  const fetchData = () => {
    setLoading(true);
    getConteoPorPolicia({ nombre: search, page, size,fecha_inicio, fecha_fin })
      .then(res => {
        setData(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page, search, fecha_inicio, fecha_fin]);

  const totalPages = Math.ceil(total / size);

  return (
    <Box>
      <Heading color="white" mb={4} size="md">
        Contar Registros por Policía
      </Heading>
      <Flex gap={3} mb={4}>
        <Input
          placeholder="Buscar por nombre..."
          bg="white"
          mb={4}
          value={search}
          onChange={(e) => {
            setPage(1);   
            setSearch(e.target.value);
          }}
        />
        <Input
          type="date"
          bg="white"
          mr={2}
          value={fecha_inicio || ''}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <Input
          type="date"
          bg="white"
          value={fecha_fin || ''}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </Flex>
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
