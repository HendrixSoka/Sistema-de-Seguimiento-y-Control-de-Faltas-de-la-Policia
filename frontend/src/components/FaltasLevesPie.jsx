import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPorcentajeSancionesFaltaLeve } from '../api/reportService';
import { Spinner,Heading } from '@chakra-ui/react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FFF', '#FF6B6B'];

export default function FaltasLevesPie() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPorcentajeSancionesFaltaLeve().then(d => setData(d)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <ResponsiveContainer width={300} height={300}>
      <Heading color="white " size="md" mb={4} textAlign="center">
        Distribución de Sanciones de Faltas Leves
      </Heading>
      <PieChart>
        <Pie
          data={data}
          dataKey="cantidad"
          nameKey="tipo_de_sancion"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{
    fontWeight: "bold",
    fontSize: '10px',
    textShadow: `
    -1px -1px 0 white,
     1px -1px 0 white,
    -1px  1px 0 white,
     1px  1px 0 white
  `,
  
  }}/>
      </PieChart>
    </ResponsiveContainer>
  );
}
