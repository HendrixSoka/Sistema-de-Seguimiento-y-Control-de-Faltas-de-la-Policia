import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  Text,
  Button,
  Flex,
  Input,
  Select,
  useToast,
} from "@chakra-ui/react";
import AutoResizeTextarea from "../components/AutoResizeTextarea";
import ComboBoxAutoResize from "../components/ComboBoxAutoResize";
import { obtenerDelitos, crearDelito, actualizarDelito } from "../api/delitoService";
import { obtenerPolicias, crearPolicia, actualizarPolicia } from "../api/policiaService";
import { getUserDataFromToken } from "../api/auth";
import { exportExcel } from "../utils/export";

export default function Delitos() {
  const user = getUserDataFromToken();
  const [delitos, setDelitos] = useState([]);
  const [policias, setPolicias] = useState([]);
  const [acciones, setAcciones] = useState([]); // {id_delito, crear: true/false, nuevo_policia: true/false}
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const toast = useToast();
  const [tieneFoco, setTieneFoco] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("");
  const [pageTodos, setPageTodos] = useState(1);
  const unidades = ["EPI-1", "EPI-2", "EPI-3", "EPI-4", "EPI-5", "EPI-6",
   "BATALLON", "ESTATAL","RURAL", "TRANSITO", "FELCC", "FELCV", "CAMINERA",
   "UTOP", "DELTA","PAC", "P. MERCED", "RP-110", "SAN PEDRO", "COMUNITARIA",
   "CANES","FATESCIPOL CARACOLLO" , "FATESCIPLO HUANUNI", "SEGURIDAD PUBLICA BOL. 110",
   "POFOMA", "DIDIPI", "TURISTICA", "DPTO. IV ADM", "FISCALIA DPTAL.", "BANDA MUSICA",
   "BOMBEROS","D. D. SALUD B. SOCIAL","GACIP", "DPTO I PERSONAL", "RECAUDACIONES",
   "RELACIONES PUBLICAS", "DIPROVE", "DD.HH", "ITCUP", "JEDECEV", "TRIBUNAL DISC.",
   "JEFATURA DEPTAL DE INTELIGENCIA", "SINARAP", "U.TE.P.P.I.", "DPTO III PPOO",
   "INTERPOL", "DIR DPTAL.SERVICIO AEREO POLICIAL", "GESTION ESTRATEGIA", "SUBCOMANDO",
   "SUB-EPI NRO3 VINTO", "COMANDO DEPARTAMENTAL DE LA POLICIA" ];
  function agregarAccion(id_delito, crear, nuevo_policia = null) {
    setAcciones((prev) => {
      if (prev.some((a) => a.id_delito === id_delito)) return prev;
      const nueva = { id_delito, crear };
      if (crear) nueva.nuevo_policia = nuevo_policia;
      return [...prev, nueva];
    });
    setEnviado(false);
  }

  async function procesarAcciones() {
    setEnviando(true);

    for (const accion of acciones) {
      const data = delitos.find((d) => d.id_delito === accion.id_delito);
      if (!data) continue;

      if (accion.crear && accion.nuevo_policia) {
        const nuevoPolicia = await crearPolicia({
          nombre: data.nombre,
          grado: data.grado,
          unidad_policial: data.unidad_policial,
          estado: data.estado,
        });
        data.id_policia = nuevoPolicia.id_policia;
      }

      if (accion.crear) {
        try {
          await crearDelito({
            fecha_inicio: data.fecha_inicio || null,
            codigo_unico: data.codigo_unico || null,
            tipo_penal: data.tipo_penal || null,
            con_detencion_preventiva: data.con_detencion_preventiva || null,
            con_detencion_domiciliaria: data.con_detencion_domiciliaria || null,
            con_sentencia_condenatoria_primera_instancia: data.con_sentencia_condenatoria_primera_instancia || null,
            con_sentencia_ejecutoriada: data.con_sentencia_ejecutoriada || null,
            observaciones: data.observaciones || null,
            id_policia: data.id_policia,
            id_usuario: user.id,
          });
        } catch (err) {
          toast({
            title: "Error al crear delito",
            description: err.response?.data?.detail || "Ocurrió un error al crear el delito.",
            status: "error",
            duration: 4000,
            isClosable: true,
            variant: "subtle"
          });
        }

      } else {
        await actualizarPolicia(data.id_policia, {
          nombre: data.nombre,
          grado: data.grado,
          unidad_policial: data.unidad_policial,
          estado : data.estado,
        });

        await actualizarDelito(data.id_delito, {
          fecha_inicio: data.fecha_inicio || null,
          codigo_unico: data.codigo_unico || null,
          tipo_penal: data.tipo_penal || null,
          con_detencion_preventiva: data.con_detencion_preventiva || null,
          con_detencion_domiciliaria: data.con_detencion_domiciliaria || null,
          con_sentencia_condenatoria_primera_instancia: data.con_sentencia_condenatoria_primera_instancia || null,
          con_sentencia_ejecutoriada: data.con_sentencia_ejecutoriada || null,
          observaciones: data.observaciones || null,
          id_policia: data.id_policia,
          id_usuario: user.id,
        });
      }
    }

    setAcciones([]);
    setEnviando(false);
    setEnviado(true);
    toast({
      title: "Acciones guardadas con éxito",
      status: "success",
      duration: 2000,
      isClosable: true,
      variant: "subtle"
    });
  }

  useEffect(() => {
    const fetchPolicias = async () => {
      try {
        const data = await obtenerPolicias();
        setPolicias(data);
      } catch (err) {
        console.error("Error cargando policías:", err);
      }
    };
    fetchPolicias();
  }, []);

  useEffect(() => {
    const fetchDelitos = async () => {
      try {
        const data = await obtenerDelitos({
          nombre_policia: filtroNombre,
          unidad_policial: unidadSeleccionada,
          page: pageTodos
        });
        setDelitos(data);
      } catch (err) {
        console.error("Error cargando delitos:", err);
      }
    };

    fetchDelitos();
  }, [filtroNombre, unidadSeleccionada, pageTodos]);


  const handleChange = (id, campo, valor) => {
    setDelitos((prev) =>
      prev.map((d) => (d.id_delito === id ? { ...d, [campo]: valor } : d))
    );
    console.log(delitos);
    agregarAccion(id, false);
  };

  const columnas = [
    { label: "N°", rowSpan: 2 },

    { label: "GRADO", rowSpan: 2 },

    { label: "NOMBRE COMPLETO DEL DENUNCIADO(A)", rowSpan: 2 },

    { label: "UNIDAD POLICIAL QUE PERTENECE", rowSpan: 2 },

    { label: "SERVICIO O DESCANSO", rowSpan: 2 },

    { label: "FECHA DE INICIO DE INVESTIGACIÓN", rowSpan: 2 },

    { label: "CÓDIGO ÚNICO DE DENUNCIA", rowSpan: 2 },

    { label: "TIPO PENAL", rowSpan: 2 },

    {
      label: "ESTADO DEL CASO",
      colSpan: 4,
      subcolumnas: [
        "CON DETENCIÓN PREVENTIVA",
        "CON DETENCIÓN DOMICILIARIA",
        "CON SENTENCIA CONDENATORIA EN 1º INSTANCIA",
        "CON SENTENCIA EJECUTORIADA"
      ]
    },

    { label: "OBS.", rowSpan: 2 }
  ];
  const cargarPolicias = async (texto) => {
    try {
      const data = await obtenerPolicias(texto); // ← ahora filtra por texto
      setPolicias(data);
    } catch (err) {
      console.error("Error cargando policías:", err);
    }
  };

  return (
    <Box p={6}>
      <Heading mb={4} color="white">
        Delitos
        <Flex align="center" gap={2}>
          {enviando && <Spinner size="sm" />}
          {enviado && !enviando && <Text ml={2}>✔️</Text>}  
          {acciones.length > 0 && !enviando && (
            <Button
            size="sm"
            colorScheme="green"
            onClick={procesarAcciones}
            isDisabled={enviando} 
          >
            Guardar ahora
          </Button>
          )}
          
        </Flex>
      </Heading>
      <Flex
        mb={4}
        align="center"         
        justify="space-between"
        gap={4}           
        flexWrap="wrap"    
      >
        <Flex align="center" gap={2}>
          <Text fontWeight="medium">Seleccione una Unidad Policial:</Text>
          <Select
            placeholder="Seleccione una unidad policial"
            value={unidadSeleccionada}
            onChange={(e) => setUnidadSeleccionada(e.target.value)}
            maxW="300px"
            bg="white"
            shadow="sm"
            size="sm"
          >
            {unidades.map((unidad, i) => (
              <option key={i} value={unidad}>
                {unidad}
              </option>
            ))}
          </Select>
        </Flex>

        <Flex align="center" gap={2}>
          <Input
            placeholder="Buscar por nombre de policía..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            width="250px"
            variant="filled"
            bg="white"
            size="sm"
            color="black"
            _placeholder={{ color: "gray.600", opacity: 1 }}
            _hover={{ bg: "gray.100" }}
            _focus={{
              bg: "white",
              borderColor: "blackAlpha.700",
            }}
          />
          {filtroNombre && (
            <Button size="sm" onClick={() => setFiltroNombre("")} bg="white" color="#60AD58" _hover={{ bg: '#e6f2e6', transform: 'scale(1.03)' }} s_active={{ bg: '#d6ead6' }}>
              Limpiar
            </Button>
          )}
        </Flex>
      </Flex>
      <Table variant="simple" bg="white" rounded="md" shadow="md" size="sm">
        <Thead bg="green.800">
          {/* Primera fila de encabezado */}
          <Tr>
            {columnas.map((col, i) => (
              <Th
                key={i}
                textAlign="center"
                color="white"
                rowSpan={col.rowSpan || 1}
                colSpan={col.colSpan || 1}
              >
                {col.label}
              </Th>
            ))}
          </Tr>

          {/* Segunda fila: solo subcolumnas */}
          <Tr bg="green.700">
            {columnas
              .filter((c) => c.subcolumnas)
              .flatMap((c, i) =>
                c.subcolumnas.map((sub, j) => (
                  <Th key={`${i}-${j}`} textAlign="center" color="white" fontSize="sm">
                    {sub}
                  </Th>
                ))
              )}
          </Tr>
        </Thead>

        <Tbody>
          {delitos.length > 0 ? (
            delitos.map((d, index) => (
              <Tr 
                key={d.id_delito} 
                bg={tieneFoco === d.id_delito ? "yellow.50" : "transparent"}
                border={tieneFoco === d.id_delito ? "2px solid" : "none"}
                borderColor={tieneFoco === d.id_delito ? "red.300" : "transparent"}
                onKeyDown={(e) => {
                  if ((e.key === "Delete" || e.key === "Del" || e.key === "Supr") && d.id_policia === null) {
                    e.preventDefault();
                    setDelitos((prev) => prev.filter(del => del.id_delito !== d.id_delito));
                  }
                }}
              >
                <Td>{index + 1}</Td>
                <Td>
                  <AutoResizeTextarea
                    value={d.grado || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "grado", e.target.value)}
                  />
                </Td>
                <Td>
                  <ComboBoxAutoResize
                    value={d.nombre}

                    onFocus={() => {
                      setTieneFoco(d.id_delito);
                      if (!d.id_policia) {
                        cargarPolicias("");
                      }
                    }}

                    onInputChange={(texto) => {
                      if (!d.id_policia) {
                        cargarPolicias(texto);
                      }
                    }}

                    options={policias.map((p) => ({
                      label: `${p.nombre} (${p.grado})`,
                      value: p.nombre,
                    }))}

                    onChange={(val) => {
                      if (d.id_policia) {
                        handleChange(d.id_delito, "nombre", val);
                        return;
                      }
                      const policia = policias.find(
                        (p) => p.nombre === val || `${p.nombre} (${p.grado})` === val
                      );

                      if (policia) {
                        handleChange(d.id_delito, "id_policia", policia.id_policia);
                        handleChange(d.id_delito, "nombre", policia.nombre);
                        handleChange(d.id_delito, "grado", policia.grado);
                        handleChange(d.id_delito, "unidad_policial", policia.unidad_policial);
                        handleChange(d.id_delito, "estado", policia.estado);
                        setAcciones(prev => 
                          prev.map(a => 
                            a.id_delito === d.id_delito 
                              ? { ...a, nuevo_policia: false }
                              : a
                          )
                        );
                      } else {
                        handleChange(d.id_delito, "nombre", val);
                      }
                    }}
                  />
                </Td>
                <Td>
                  <Select
                    placeholder="Unidad policial"
                    onFocus={() => setTieneFoco(d.id_delito)}
                    value={d.unidad_policial || ""}
                    onChange={(e) => handleChange(d.id_delito, "unidad_policial", e.target.value)}
                    width="200px"
                  >
                    {unidades.map((unidad, i) => (
                      <option key={i} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <Select
                    value={d.estado}
                    onChange={(e) => handleChange(d.id_delito, "estado", e.target.value) }
                    onFocus={() => setTieneFoco(d.id_delito)}
                    placeholder="Seleccione estado"
                    width="150px"
                  >
                    <option value="Descanso">Descanso</option>
                    <option value="Servicio">Servicio</option>
                  </Select>
                </Td>
                <Td>
                  <Input
                    type="date"
                    value={d.fecha_inicio || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                </Td>
                <Td>
                  <AutoResizeTextarea
                    value={d.codigo_unico || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "codigo_unico", e.target.value)}
                  />
                </Td>
                <Td>
                  <AutoResizeTextarea
                    value={d.tipo_penal || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "tipo_penal", e.target.value)}
                  />
                </Td>

                <td>
                  <AutoResizeTextarea
                    value={d.con_detencion_preventiva || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "con_detencion_preventiva", e.target.value)}
                  />
                </td>
                <td>
                  <AutoResizeTextarea
                    value={d.con_detencion_domiciliaria || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "con_detencion_domiciliaria", e.target.value)}
                  />
                </td>
                <td>
                  <AutoResizeTextarea
                    value={d.con_sentencia_condenatoria_primera_instancia || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "con_sentencia_condenatoria_primera_instancia", e.target.value)}
                  />
                </td>
                <td>
                  <AutoResizeTextarea
                    value={d.con_sentencia_ejecutoriada || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "con_sentencia_ejecutoriada", e.target.value)}
                  />
                </td>
                  
                <Td>
                  <AutoResizeTextarea
                    value={d.observaciones || ""}
                    onFocus={() => setTieneFoco(d.id_delito)}
                    onChange={(e) => handleChange(d.id_delito, "observaciones", e.target.value)}
                  />
                </Td>
              </Tr>
            ))
          ):(
            <Tr>
              <Td colSpan={columnas.length+10} textAlign="center" py={4} color="black.900" fontSize="lg">
                  No hay faltas registradas para {unidadSeleccionada}.
              </Td>
            </Tr>
          )}

          

          <Tr bg="gray.50">
            <Td colSpan={columnas.length + 3} textAlign="center">
              <Button
                colorScheme="blue"
                size="sm"
                onClick={() => {
                  const nuevo = {
                    id_delito: Date.now(),
                    grado: "",
                    nombre: "",
                    unidad_policial: "",
                    estado: "",
                    fecha_inicio: "",
                    codigo_unico: "",
                    tipo_penal: "",
                    con_detencion_preventiva: "",
                    con_detencion_domiciliaria: "",
                    con_sentencia_condenatoria_primera_instancia: "",
                    con_sentencia_ejecutoriada: "",
                    observaciones: "",
                    id_policia: null,
                  };
                  setDelitos((prev) => [...prev, nuevo]);
                  agregarAccion(nuevo.id_delito, true, true);
                  setTieneFoco(nuevo.id_delito);
                }}
              >
                ➕ Agregar nuevo delito
              </Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
      <Flex justify="center" mt={3} gap={3}>
        <Button
            isDisabled={pageTodos === 1}
            onClick={() => setPageTodos((p) => p - 1)}
        >
            Anterior
        </Button>

        <Button
            isDisabled={delitos.length < 20} 
            onClick={() => setPageTodos((p) => p + 1)}
        >
            Siguiente
        </Button>
      </Flex>
      <Button
        bg="white"
        color="#2F6B2E" 
        _hover={{ bg: '#e6f2e6', transform: 'scale(1.03)' }}
        _active={{ bg: '#d6ead6' }}
        justifyContent="flex-start"
        fontWeight="semibold"
        borderRadius="lg"
        transition="all 0.15s"
        onClick={() => exportExcel(
          columnas, 
          delitos,{
          "N°": "id_delito",
          "GRADO": "grado",
          "NOMBRE COMPLETO DEL DENUNCIADO(A)": "nombre",
          "UNIDAD POLICIAL QUE PERTENECE": "unidad_policial",
          "SERVICIO O DESCANSO": "estado",
          "FECHA DE INICIO DE INVESTIGACIÓN": "fecha_inicio",
          "CÓDIGO ÚNICO DE DENUNCIA": "codigo_unico",
          "TIPO PENAL": "tipo_penal",
          "CON DETENCIÓN PREVENTIVA": "con_detencion_preventiva",
          "CON DETENCIÓN DOMICILIARIA": "con_detencion_domiciliaria",
          "CON SENTENCIA CONDENATORIA EN 1º INSTANCIA": "con_sentencia_condenatoria_primera_instancia",
          "CON SENTENCIA EJECUTORIADA": "con_sentencia_ejecutoriada",
          "OBS.": "observaciones"
        }, 
        "Delitos",
        [{title:"SEGUIMIENTO Y CONTROL DE LA COMISIÓN DE DELITOS INSP.DPTAL.POL. ORURO FECHA:" + new Date().toLocaleDateString(),col:0,colSpan:13}])}
      >
        Exportar Excel
      </Button>
    </Box>
  );
}