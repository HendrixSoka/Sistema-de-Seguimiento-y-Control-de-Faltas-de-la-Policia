import React, { useEffect, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Progress, Box, Spinner } from '@chakra-ui/react';
import { getRankingDelitos } from '../api/reportService';

export default function TablaDelitos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankingDelitos().then(d => setData(d)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const maxTotal = Math.max(...data.map(d => d.total));

  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th color="white">Tipo Penal</Th>
            <Th color="white">Total</Th>
            <Th color="white">Porcentaje</Th>
          </Tr>
        </Thead>
        <Tbody bg="green.100">
          {data.map(d => (
            <Tr key={d.tipo_penal}>
              <Td>{d.tipo_penal}</Td>
              <Td>{d.total}</Td>
              <Td>
                <Box width="100%">
                  <Progress value={(d.total / maxTotal) * 100} colorScheme="red" size="sm" />
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
