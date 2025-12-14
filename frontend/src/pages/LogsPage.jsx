import {
  Box,
  Heading,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Button,
  Badge,
  Spinner,
  Center,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import TarjetaLog from "../components/TarjetaLog";
import { getLogs} from "../api/logsService";
import { obtenerUsuarios } from "../api/auth";


export default function LogsPage() {
  const toast = useToast();

  const [modo, setModo] = useState("usuario"); 
  const [usuarios, setUsuarios] = useState([]);
  const [tablas] = useState(["Faltas_Graves", "Delitos", "Faltas_Leves"]);

  const [logsTodos, setLogsTodos] = useState([]);

  const [pageUsuarios, setPageUsuarios] = useState(1);

  const [pageTodos, setPageTodos] = useState(1);

  const [pagesUsuarios, setPagesUsuarios] = useState({}); // { 1: 1, 2: 1, ... }
  const [pagesTablas, setPagesTablas] = useState({});     // { "Faltas_Graves": 1, "Delitos": 1, ... }


  const [logsPorUsuario, setLogsPorUsuario] = useState({});
  const [logsPorTabla, setLogsPorTabla] = useState({});

  const [loading, setLoading] = useState(false);

  const [accionFiltro, setAccionFiltro] = useState("todos");
  // === Cargar usuarios ===
  useEffect(() => {
    if (modo !== "usuario") return;
    (async () => {
      try {
        const data = await obtenerUsuarios();
        setUsuarios(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar usuarios.",
          status: "error",
        });
      }
    })();
  }, [modo]);

  // === Cargar logs por usuario ===
  useEffect(() => {
    if (modo !== "usuario") return;

    const cargar = async () => {
      setLoading(true);

      // Mostrar solo 3 usuarios por página
      const inicio = (pageUsuarios - 1) * 3;
      const usuariosPagina = usuarios.slice(inicio, inicio + 3);

      const logsTemp = {};
      for (let u of usuariosPagina) {
        const page = pagesUsuarios[u.id_usuario] || 1;
        logsTemp[u.id_usuario] = await getLogs({
          page,
          limit: 10,
          id_usuario: u.id_usuario,
          accion: accionFiltro === "todos" ? undefined : accionFiltro,
        });
      }

      setLogsPorUsuario(logsTemp);
      setLoading(false);
    };

    if (usuarios.length > 0) cargar();
  }, [modo, usuarios,accionFiltro, pageUsuarios, pagesUsuarios]);

  // === Cargar logs por tabla ===
  useEffect(() => {
    if (modo !== "tabla") return;

    const cargar = async () => {
      setLoading(true);

      const tablasPagina = tablas.slice(0, 3);

      const logsTemp = {};
      
      for (let t of tablasPagina) {
        const page = pagesTablas[t] || 1;
        const logs = await getLogs({ page, limit: 10, tabla: t,accion: accionFiltro === "todos" ? undefined : accionFiltro});
        if (t === "Faltas_Graves") {
            const logsEtapa = await getLogs({ page, limit: 10, tabla: "Etapa" ,accion: accionFiltro === "todos" ? undefined : accionFiltro,});
            logsTemp[t] = [...logs, ...logsEtapa]; 
        } else {
            logsTemp[t] = logs;
        }
     }

      setLogsPorTabla(logsTemp);
      setLoading(false);
    };

    cargar();
  }, [modo, tablas,accionFiltro, pagesTablas]);

  useEffect(() => {
    if (modo !== "todo") return;

    const cargar = async () => {
        setLoading(true);
        const page = pageTodos;
        const data = await getLogs({
            page,
            limit: 50,
            accion: accionFiltro === "todos" ? undefined : accionFiltro,
        });

        setLogsTodos(data);
        setLoading(false);
    };

    cargar();
  }, [modo,accionFiltro, pageTodos]);
  return (
    <Box p={6}>
      <Heading size="lg" mb={5} color="white">
        Historial de Logs
      </Heading>
      <Flex mb={6} align="center" justify="space-between" flexWrap="wrap">
        {/* Radios a la izquierda */}
        <RadioGroup onChange={setModo} value={modo}>
            <Stack direction="row" spacing={6}>
            <Radio value="usuario" colorScheme="gray">
                <Text color= "gray.100">Por Usuario</Text>
            </Radio>
            <Radio value="tabla" colorScheme="gray">
                <Text color= "gray.100">Por Tabla</Text>
            </Radio>
            <Radio value="todo" colorScheme="gray">
                <Text color= "gray.100">Todos los cambios</Text>
            </Radio>
            </Stack>
        </RadioGroup>

        {/* Select a la derecha */}
        <Flex align="center" gap={2}>
            <Text mb={2} color = "gray.100">Filtrar por acción:</Text>
            <select
            value={accionFiltro}
            onChange={(e) => setAccionFiltro(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px" }}
            >
            <option value="todos">Todos</option>
            <option value="crear">Crear</option>
            <option value="modificar">Modificar</option>
            <option value="eliminar">Eliminar</option>
            </select>
        </Flex>
      </Flex>
      {/* LOADING */}
      {loading && (
        <Center p={20}>
          <Spinner size="xl" />
        </Center>
      )}

      {/* === POR USUARIO === */}
      {modo === "usuario" && !loading && (
        <>
          {usuarios
            .slice((pageUsuarios - 1) * 3, (pageUsuarios - 1) * 3 + 3)
            .map((u) => (
              <Box mb={8} key={u.id_usuario}>
                <Heading size="md" mb={3}>
                  {u.nombre} (ID {u.id_usuario})
                </Heading>

                {logsPorUsuario[u.id_usuario]?.length === 0 ? (
                  <Text>No hay registros.</Text>
                ) : (
                <>
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 3 }} spacing={4}> 
                        {logsPorUsuario[u.id_usuario]?.map((log) => (
                            <TarjetaLog key={log.id_log} log={log} />  
                        ))}
                    </SimpleGrid>

                    <Flex justify="center" gap={2} mt={3}>
                    <Button
                        isDisabled={(pagesUsuarios[u.id_usuario] || 1) === 1}
                        onClick={() =>
                        setPagesUsuarios((p) => ({
                            ...p,
                            [u.id_usuario]: (p[u.id_usuario] || 1) - 1,
                        }))
                        }
                    >
                        Anterior
                    </Button>
                    <Button
                        isDisabled={logsPorUsuario[u.id_usuario]?.length < 10}
                        onClick={() =>
                        setPagesUsuarios((p) => ({
                            ...p,
                            [u.id_usuario]: (p[u.id_usuario] || 1) + 1,
                        }))
                        }
                    >
                        Siguiente
                    </Button>
                    </Flex>
                </>
                )}
              </Box>
            ))}

          {/* Paginación Usuarios */}
          <Flex justify="center" mt={5} gap={3}>
            <Button
              isDisabled={pageUsuarios === 1}
              onClick={() => setPageUsuarios((p) => p - 1)}
            >
              Anterior
            </Button>

            <Button
              isDisabled={pageUsuarios * 3 >= usuarios.length}
              onClick={() => setPageUsuarios((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Flex>
        </>
      )}

      {/* === POR TABLA === */}
      {modo === "tabla" && !loading && (
        <>
          {tablas
            .map((t) => (
              <Box mb={8} key={t}>
                <Heading size="md" mb={3}>
                  Tabla: {t}
                </Heading>

                {logsPorTabla[t]?.length === 0 ? (
                  <Text>No hay registros.</Text>
                ) : (
                <>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 3 }} spacing={4}>
                    {logsPorTabla[t]?.map((log) => (
                        <TarjetaLog key={log.id_log} log={log} />
                    ))}
                  </SimpleGrid>
                  <Flex justify="center" mt={3} gap={3}>
                    <Button
                    isDisabled={(pagesTablas[t] || 1) === 1}
                    onClick={() =>
                        setPagesTablas((p) => ({
                        ...p,
                        [t]: (p[t] || 1) - 1,
                        }))
                    }
                    >
                    Anterior
                    </Button>

                    <Button
                    isDisabled={logsPorTabla[t]?.length < 10} 
                    onClick={() =>
                        setPagesTablas((p) => ({
                        ...p,
                        [t]: (p[t] || 1) + 1,
                        }))
                    }
                    >
                    Siguiente
                    </Button>
                </Flex>
                </>
                )}
              </Box>
            ))}
        </>
      )}
      {modo === "todo" && !loading && (
        <>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 3 }} spacing={4}>    
            {logsTodos.map(log => (
                <TarjetaLog key={log.id_log} log={log} />
            ))}
        </SimpleGrid>
        <Flex justify="center" mt={3} gap={3}>
            <Button
                isDisabled={pageTodos === 1}
                onClick={() => setPageTodos((p) => p - 1)}
            >
                Anterior
            </Button>

            <Button
                isDisabled={logsTodos.length < 10} 
                onClick={() => setPageTodos((p) => p + 1)}
            >
                Siguiente
            </Button>
            </Flex>
        </>
      )}
    </Box>
  );
}
