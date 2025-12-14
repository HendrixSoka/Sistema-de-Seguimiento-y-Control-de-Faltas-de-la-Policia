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
  Select,
  Spinner,
  Text,
  Center,
  Button,
  Flex,
  Input,
  useToast,
} from "@chakra-ui/react";
import AutoResizeTextarea from "../components/AutoResizeTextarea";
import ComboBoxAutoResize from "../components/ComboBoxAutoResize";
import { obtenerFaltasLeves, crearFaltaLeve,actualizarFaltaLeve } from "../api/faltaLeveService";
import { crearPolicia ,actualizarPolicia, obtenerPolicias} from "../api/policiaService";
import { getUserDataFromToken } from "../api/auth";
import { exportExcelException } from "../utils/export";

export default function FaltaLeves() {
  const user = getUserDataFromToken();
  const [policias, setPolicias] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tieneFoco, setTieneFoco] = useState(null);
  const [acciones,setAcciones] = useState([]); // {id_falta_leve, crear: true/false, nuevo_policia: true/false}
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const toast = useToast();
  const [filtroNombre, setFiltroNombre] = useState("");
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
   
  function agregarAccion(id_falta_leve, crear, nuevo_policia = null) {
    setAcciones(prev => {
      const idx = prev.findIndex(a => a.id_falta_leve === id_falta_leve);
      if (idx !== -1) { 
        return prev;
      }

      const nueva = { id_falta_leve, crear };
      if (crear) nueva.nuevo_policia = nuevo_policia;
      return [...prev, nueva];
    });
    setEnviado(false);
  }

  async function procesarAcciones() {
    console.log("Procesando acciones:", acciones);
    console.log(faltas);

    for (const accion of acciones) {

      const data = faltas.find(f => f.id_falta_leve === accion.id_falta_leve);
      if (!data) {
        console.warn("No se encontró la falta correspondiente:", accion.id_falta_leve);
        continue; 
      }
      if (accion.crear && accion.nuevo_policia) {
        const nuevoPolicia = await crearPolicia({
          nombre: data.nombre,
          grado: data.grado,
          unidad_policial: unidadSeleccionada,
        });
        data.id_policia = nuevoPolicia.id_policia;
      }
      if (accion.crear) {
        await crearFaltaLeve({
          hoja_tramite_nro: data.hoja_tramite_nro || null,
          hoja_tramite_fecha: data.hoja_tramite_fecha || null,
          memorandum_nro: data.memorandum_nro || null,
          memorandum_fecha: data.memorandum_fecha || null,
          tipo_de_sancion: data.tipo_de_sancion || null,
          descripcion_sancion: data.descripcion_sancion || null,
          nro_oficio_archivo: data.nro_oficio_archivo || null,
          observaciones: data.observaciones || null,
          id_policia: data.id_policia,
          id_usuario: user.id,
        });
      } else {
        await actualizarPolicia(data.id_policia, {
          nombre: data.nombre,
          grado: data.grado,
          unidad_policial: unidadSeleccionada,
        });

        await actualizarFaltaLeve(data.id_falta_leve,{
          hoja_tramite_nro: data.hoja_tramite_nro || null,
          hoja_tramite_fecha: data.hoja_tramite_fecha || null,
          memorandum_nro: data.memorandum_nro || null,
          memorandum_fecha: data.memorandum_fecha || null,
          tipo_de_sancion: data.tipo_de_sancion || null,
          descripcion_sancion: data.descripcion_sancion || null,
          nro_oficio_archivo: data.nro_oficio_archivo || null,
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

  const handleChangeFalta = (id, campo, valor) => {
    setFaltas((prev) =>
      prev.map((f) =>
        f.id_falta_leve === id
          ? { ...f, [campo]: valor }
          : f
      )
    );
    agregarAccion(id, false);
  };


  const columnas = [
    { label: "N°", rowSpan: 2 },
    {
      label: "HOJA DE TRÁMITE",
      colSpan: 2,
      subcolumnas: ["Nro", "Fecha"]
    },
    { label: "GRADO", rowSpan: 2 },
    { label: "DENUNCIADO(A)", rowSpan: 2 },
    {
      label: "MEMORÁNDUM",
      colSpan: 2,
      subcolumnas: ["Nro", "Fecha"]
    },
    {
      label: "TIPO DE SANCIÓN",
      colSpan: 6, // cantidad de sanciones
      subcolumnas: [
        "ART. 9 LLAMADA DE ATENCION VERBAL",
        "ART. 10 LLAMADA DE ATENCION ESCRITA",
        "ART. 10 ARRESTO DE 1 A 3 DIAS",
        "ART. 11 LLAMADA DE ATENCION ESCRITA",
        "ART. 11 ARRESTO DE 4 A 10 DIAS",
        "REPRESENTACIONES"
      ]
    },
    {
      label: "DESCRIPCIÓN DE LA SANCIÓN DISCIPLINARIA IMPUESTA",
      rowSpan: 2
    },
    {
      label: "NRO. DE OFICIO DE ARCHIVO INSP.",
      rowSpan: 2
    },
    { label: "OBS.", rowSpan: 2 }
  ];


  useEffect(() => {
    const fetchData = async () => {
      if (!unidadSeleccionada) return;
      setCargando(true);
      try {
        const faltasData = await obtenerFaltasLeves({
          nombre_policia: filtroNombre,
          unidad_policial: unidadSeleccionada,
          page: pageTodos
        });
        setFaltas(faltasData);
      } catch (error) {
        console.error("Error cargando faltas leves:", error);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, [unidadSeleccionada, filtroNombre, pageTodos]);

  useEffect(() => {
    const fetchPolicias = async () => {
      try {
        const data = await obtenerPolicias();
        setPolicias(data);
      } catch (error) {
        console.error("Error cargando policías:", error);
      }
    };
    fetchPolicias();
  }, []);

  const cargarPolicias = async (texto) => {
    try {
      const data = await obtenerPolicias(texto);
      setPolicias(data);
    } catch (err) {
      console.error("Error cargando policías:", err);
    }
  };
  return (
    <Box p={6}>
      <Heading mb={4} color="white">
        Faltas Leves
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
          <Text fontWeight="medium" color = "gray.100">Seleccione una Unidad Policial:</Text>
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


      {cargando ? (
        <Center py={8}>
          <Spinner size="lg" color="green.500" />
        </Center>
      ) : unidadSeleccionada === "" ? (
        <Center py={6}>
          <Text color="gray.200" fontSize="2xl">
            Seleccione una unidad policial para ver las faltas leves.
          </Text>
        </Center>
      ) : (
        <>
        <Table variant="simple" bg="white" rounded="md" shadow="md" size="sm">
          <Thead>
            {/* Fila 1 */}
            <Tr bg="green.900">
              {columnas.map((col, i) => (
                <Th
                  key={i}
                  colSpan={col.colSpan || 1}
                  rowSpan={col.rowSpan || 1}
                  textAlign="center"
                  color="white"
                >
                  {col.label}
                </Th>
              ))}
            </Tr>

            {/* Fila 2 */}
            <Tr bg="green.700">
              {columnas.map((col, i) =>
                col.subcolumnas
                  ? col.subcolumnas.map((sub, j) => (
                      <Th
                        key={`${i}-${j}`}
                        color="white"
                        textAlign="center"
                        fontSize="sm"
                      >
                        {sub}
                      </Th>
                    ))
                  : col.rowSpan === 2
                  ? null
                  : null
              )}
            </Tr>
          </Thead>

          <Tbody>
            {faltas.length > 0 ? (
              faltas.map((falta, index) => (
              <Tr
                key={falta.id_falta_leve}
                verticalAlign="middle"
                bg={tieneFoco === falta.id_falta_leve ? "yellow.50" : "transparent"}
                border={tieneFoco === falta.id_falta_leve ? "2px solid" : "none"}
                borderColor={tieneFoco === falta.id_falta_leve ? "blue.300" : "transparent"}
                onKeyDown={(e) => {
                  if ((e.key === "Delete" || e.key === "Del" || e.key === "Supr") && falta.id_policia === null) {
                    e.preventDefault();
                    setFaltas((prev) => prev.filter(f => f.id_falta_leve !== falta.id_falta_leve));
                  }
                }}
              >
                <Td>{index + 1}</Td>

                <Td>
                  <AutoResizeTextarea
                    value={falta.hoja_tramite_nro || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_leve)}
                    onChange={(e) => handleChangeFalta(falta.id_falta_leve, "hoja_tramite_nro", e.target.value)}
                  />
                </Td>

                <Td> 
                  <Input 
                    type="date" 
                    autoComplete="off" 
                    value={ falta.hoja_tramite_fecha || "" }
                    onFocus={() => setTieneFoco(falta.id_falta_leve)} 
                    onChange={(e) => handleChangeFalta(falta.id_falta_leve, "hoja_tramite_fecha", e.target.value)} 
                    variant="unstyled" size="sm" textAlign="center" /> 
                </Td>

                <Td>
                  <AutoResizeTextarea
                    value={falta.grado || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_leve)}
                    onChange={(e) => handleChangeFalta(falta.id_falta_leve, "grado", e.target.value)}
                  />
                </Td>

                <Td position="relative">
                  <ComboBoxAutoResize
                    value={falta.nombre}

                    onFocus={() => {
                      setTieneFoco(falta.id_falta_leve);
                      if (!falta.id_policia) {
                        cargarPolicias("");
                      }
                    }}

                    onInputChange={(texto) => {
                      if (!falta.id_policia) {
                        cargarPolicias(texto);
                      }
                    }}

                    options={policias.map((p) => ({
                      label: `${p.nombre} (${p.grado})`,
                      value: p.nombre,
                    }))}

                    onChange={(val) => {
                      if (falta.id_policia) {
                        handleChangeFalta(falta.id_falta_leve, "nombre", val);
                        return;
                      }
                      const policia = policias.find(
                        (p) => p.nombre === val || `${p.nombre} (${p.grado})` === val
                      );

                      if (policia) {
                        handleChangeFalta(falta.id_falta_leve, "id_policia", policia.id_policia);
                        handleChangeFalta(falta.id_falta_leve, "nombre", policia.nombre);
                        handleChangeFalta(falta.id_falta_leve, "grado", policia.grado);
                        setAcciones(prev => 
                          prev.map(a => 
                            a.id_falta_leve === falta.id_falta_leve 
                              ? { ...a, nuevo_policia: false }
                              : a
                          )
                        );
                      } else {
                        handleChangeFalta(falta.id_falta_leve, "nombre", val);
                      }
                    }}
                  />
                </Td>
                

                <Td>
                  <AutoResizeTextarea
                    value={falta.memorandum_nro || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_leve)}
                    onChange={(e) => handleChangeFalta(falta.id_falta_leve, "memorandum_nro", e.target.value)}
                  />
                </Td>

                <Td> 
                  <Input 
                  type="date" 
                  autoComplete="off" 
                  value={ falta.memorandum_fecha || "" } 
                  onFocus={() => setTieneFoco(falta.id_falta_leve)} 
                  onChange={(e) => handleChangeFalta(falta.id_falta_leve, "memorandum_fecha", e.target.value)} 
                  variant="unstyled" size="sm" textAlign="center" /> 
                </Td>

                {columnas
                  .find((c) => c.label === "TIPO DE SANCIÓN")
                  .subcolumnas.map((tipo, i) => (
                    <Td
                      key={i}
                      textAlign="center"
                      bg={falta.tipo_de_sancion === tipo ? "green.100" : "transparent"}
                      color={falta.tipo_de_sancion === tipo ? "green.700" : "gray.600"}
                      fontWeight={falta.tipo_de_sancion === tipo ? "bold" : "normal"}
                      onClick={() => handleChangeFalta(falta.id_falta_leve, "tipo_de_sancion", tipo)}
                      cursor="pointer"
                    >
                      {falta.tipo_de_sancion === tipo ? "✔️" : ""}
                    </Td>
                  ))}

                <Td>
                  <AutoResizeTextarea
                    value={falta.descripcion_sancion || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_leve)}
                    onChange={(e) => {
                      handleChangeFalta(falta.id_falta_leve, "descripcion_sancion", e.target.value);
                      agregarAccion(falta.id_falta_leve, false);
                    }}
                  />
                </Td>

                <Td>
                  <AutoResizeTextarea
                    value={falta.nro_oficio_archivo || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_leve)}
                    onChange={(e) => handleChangeFalta(falta.id_falta_leve, "nro_oficio_archivo", e.target.value)}
                  />
                </Td>

                <Td>
                  <AutoResizeTextarea
                    value={falta.observaciones || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_leve)}
                    onChange={(e) => handleChangeFalta(falta.id_falta_leve, "observaciones", e.target.value)}
                  />
                </Td>
              </Tr>
            ))
            ) : (
              <Tr>
                <Td
                  colSpan={8 + 6}
                  textAlign="center"
                  py={4}
                  color="black.900"
                  fontSize="lg"
                >
                  No hay faltas registradas para {unidadSeleccionada}.
                </Td>
              </Tr>
            )}

            {/* 🔽 Fila extra para agregar nueva falta */}
            <Tr bg="gray.50">
              <Td colSpan={8 + 6} textAlign="center">
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={() => {
                    const nueva = {
                      id_falta_leve: Date.now(),
                      hoja_tramite_nro: "",
                      hoja_tramite_fecha: "",
                      memorandum_nro: "",
                      memorandum_fecha: "",
                      nombre: "",
                      grado: "",
                      tipo_de_sancion: "",
                      descripcion_sancion: "",
                      nro_oficio_archivo: "",
                      observaciones: "",
                      id_policia: null
                    };
                    setFaltas((prev) => [...prev, nueva]);
                    agregarAccion(nueva.id_falta_leve, true, true);
                    setTieneFoco(nueva.id_falta_leve);
                  }}
                >
                  ➕ Agregar nueva falta
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
              isDisabled={faltas.length < 20} 
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
          onClick={() => exportExcelException(
            columnas, 
            faltas, 
          "FaltasLeves",
          [{title:"SEGUIMIENTO Y CONTROL",col:0,colSpan:16},
           {title:"DE LLAMADAS DE ATENCIÓN Y ARRESTOS DISCIPLINARIOS POR FALTAS LEVES",col:0,colSpan:16},
           {title:" ",col:0,colSpan:16},
           [{title:"UNIDAD POLICIAL: "+unidadSeleccionada,col:0,colSpan:11},
            {title:"MES: "+ new Date().getMonth() ,col:11,colSpan:3},
            {title:"AÑO: " + new Date().getFullYear(),col:14,colSpan:2}],
           
           {title:" ",col:0,colSpan:16},
          ])}
        >
          Exportar Excel
        </Button>
        </>
      )}
    </Box>
  );
}
