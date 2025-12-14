import React, { useEffect, useState } from 'react';
import { Box, Wrap, WrapItem } from '@chakra-ui/react';

import TablaPolicias from '../components/TablaPolicias';
import TablaDelitos from '../components/TablaDelitos';
import FaltasLevesPie from '../components/FaltasLevesPie';
import ContFaltaGrave from '../components/ContFaltaGrave';

import { getEtapaContar } from '../api/reportService';

export default function HomePage() {
  const [faltasGravesData, setFaltasGravesData] = useState([]);

  useEffect(() => {
    getEtapaContar().then(d => setFaltasGravesData(d));
  }, []);

  return (
    <Box w="100vw" h="100vh" p="10px" overflowY="auto">
      
      <Wrap spacing="20px" align="center" justify="center">
        
        <WrapItem>
          <Box>
            <TablaPolicias />
          </Box>
        </WrapItem>
        <WrapItem>
          <Box>
            <ContFaltaGrave data={faltasGravesData} />
          </Box>
        </WrapItem>
        <WrapItem>
          <Box>
            <TablaDelitos />
          </Box>
        </WrapItem>

        <WrapItem>
          <Box>
            <FaltasLevesPie />
          </Box>
        </WrapItem>

      </Wrap>

    </Box>
  );
}
