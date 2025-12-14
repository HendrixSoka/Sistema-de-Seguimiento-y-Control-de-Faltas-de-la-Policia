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
import {
  obtenerFaltasGraves,
  crearFaltaGrave,
  actualizarFaltaGrave,
  extenderEtapa,
  eliminarEtapa,
  crearEtapa,
  modificarEtapa,
} from "../api/faltaGraveService";
import { crearPolicia, actualizarPolicia, obtenerPolicias } from "../api/policiaService";
import { getUserDataFromToken } from "../api/auth";
import { exportExcelFaltasGraves } from "../utils/export";

export default function FaltaGraves() {
  const user = getUserDataFromToken();
  const [policias, setPolicias] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tieneFoco, setTieneFoco] = useState(null);
  const [acciones, setAcciones] = useState([]);
  const [accionesEtapas, setAccionesEtapas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const toast = useToast();
  const [filtroNombre, setFiltroNombre] = useState("");
  const [tiempoRestante, setTiempoRestante] = useState("");
  const [colorTiempo, setColorTiempo] = useState("gray");
  const faltaActiva = faltas.find(f => f.id_falta_grave === tieneFoco);

  const [pageTodos, setPageTodos] = useState(1);
  const ultimaEtapa = faltaActiva?.etapas?.length
  ? faltaActiva.etapas[faltaActiva.etapas.length - 1]
  : null;

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


  useEffect(() => {
    if (!ultimaEtapa || !ultimaEtapa.fecha_vencimiento) {
      setTiempoRestante("--:--:--");
      setColorTiempo("gray");
      return;
    }

    const interval = setInterval(() => {
      const ahora = new Date();
      const venc = new Date(ultimaEtapa.fecha_vencimiento);
      const diffMs = venc - ahora;

      if (diffMs <= 0) {
        setTiempoRestante("Vencido");
        setColorTiempo("red");
        clearInterval(interval);
        return;
      }

      const horas = Math.floor(diffMs / (1000 * 60 * 60));
      const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);
      if (diffMs <= 24 * 60 * 60 * 1000) {
        setColorTiempo("red");
      } else {
        setColorTiempo("black");
      }

      setTiempoRestante(`${horas}h ${minutos}m ${segundos}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [tieneFoco]);

  function agregarAccion(id_falta_grave, crear, nuevo_policia = null) {
    setAcciones((prev) => {
      const idx = prev.findIndex((a) => a.id_falta_grave === id_falta_grave);
      if (idx !== -1) return prev;
      const nueva = { id_falta_grave, crear };
      if (crear) nueva.nuevo_policia = nuevo_policia;
      return [...prev, nueva];
    });
    setEnviado(false);
  }

  async function procesarAcciones() {
    setEnviando(true);
    for (const accion of acciones) {
      const data = faltas.find((f) => f.id_falta_grave === accion.id_falta_grave);
      if (!data) continue;

      if (accion.crear && accion.nuevo_policia) {
        const nuevoPolicia = await crearPolicia({
          nombre: data.nombre,
          grado: data.grado, 
          unidad_policial: data.unidad_policial,
        });
        data.id_policia = nuevoPolicia.id_policia;
      }

      if (accion.crear) {
        const tempID = data.id_falta_grave;
        const nuevaFalta = await crearFaltaGrave({
          nro_caso: data.nro_caso || null,
          tipificacion: data.tipificacion || null,
          investigador_asignado: data.investigador_asignado || null,
          fiscal_asignado: data.fiscal_asignado || null,
          defensa_asignado: data.defensa || null,
          observaciones: data.observaciones || null,
          id_policia: data.id_policia,
          id_usuario: user.id,
        });
        const realID = nuevaFalta.id_falta_grave;
        data.id_falta_grave = realID;
        accionesEtapas.forEach(accionEtapa => {
          if (accionEtapa.id_falta_grave === tempID) {
            accionEtapa.id_falta_grave = realID;
          }
        });
      } else {
        await actualizarPolicia(data.id_policia, {
          nombre: data.nombre,
          grado: data.grado,
          unidad_policial: data.unidad_policial,
        });

        await actualizarFaltaGrave(data.id_falta_grave, {
          nro_caso: data.nro_caso || null,
          tipificacion: data.tipificacion || null,
          investigador_asignado: data.investigador_asignado || null,
          fiscal_asignado: data.fiscal_asignado || null,
          defensa_asignado: data.defensa || null,
          observaciones: data.observaciones || null,
          id_policia: data.id_policia,
          id_usuario: user.id,
        });
      }
    }
    setAcciones([]);
    for (const accion of accionesEtapas) {
      const falta = faltas.find(f => f.id_falta_grave === accion.id_falta_grave);
      if (!falta) return null; 
      const etapa = falta.etapas?.find(e => e.id_etapa === accion.id_etapa) || null;

      if (!etapa) continue;
      if (accion.crear) {
        await crearEtapa({
          id_falta_grave: etapa.id_falta_grave,
          nombre_etapa: etapa.nombre_etapa,
          fecha_inicio: etapa.fecha_inicio,
          descripcion: etapa.descripcion || null,
          id_usuario: user.id
        });
      } else {
        await modificarEtapa(etapa.id_etapa, {
          fecha_inicio: etapa.fecha_inicio,
          descripcion: etapa.descripcion || null,
          id_usuario: user.id
        });
      }
    }
    setAccionesEtapas([]);
    
    toast({
      title: "Acciones guardadas con éxito",
      status: "success",
      duration: 2000,
      isClosable: true,
      variant: "subtle"
    });
    setEnviando(false);
    setEnviado(true);
  }
  const handleChangeFalta = (id, campo, valor) => {
    setFaltas((prev) =>
      prev.map((f) => (f.id_falta_grave === id ? { ...f, [campo]: valor } : f))
    );
    agregarAccion(id, false);
    console.log(faltasFiltrados);
  };

  const handleChangeEtapa = (idFalta, nombreEtapa, campo, valor) => {
    let nuevaAccion = null;

    setFaltas(prev =>
      prev.map(f => {
        if (f.id_falta_grave !== idFalta) return f;

        const etapas = [...f.etapas];
        const index = etapas.findIndex(e => e.nombre_etapa === nombreEtapa);

        if (index !== -1) {
          const etapa = { 
            ...etapas[index], 
            [campo]: valor,
            crear: false,
          };

          etapas[index] = etapa;
          nuevaAccion = {
            id_etapa: etapa.id_etapa,
            crear: false,
            id_falta_grave: idFalta
          };

          return { ...f, etapas };
        }

        const nuevaEtapa = {
          id_etapa: null,
          id_falta_grave: idFalta,
          nombre_etapa: nombreEtapa,
          fecha_inicio: campo === "fecha_inicio" ? valor : "",
          descripcion: campo === "descripcion" ? valor : "",
          crear: true,
        };

        etapas.push(nuevaEtapa);

        nuevaAccion = {
          id_etapa: null,
          crear: true,
          id_falta_grave: idFalta
        };

        return { ...f, etapas };
      })
    );

    if (nuevaAccion) {
      agregarAccionEtapa(nuevaAccion.id_etapa,nuevaAccion.crear,nuevaAccion.id_falta_grave);
    }
  };

  function agregarAccionEtapa(id_etapa, crear = false, id_falta_grave) {
    setAccionesEtapas(prev => {
      if (prev.some(a => a.id_etapa === id_etapa)) return prev; 
      return [...prev, { id_etapa, crear, id_falta_grave }];
    });
    setEnviado(false);
  }


  const columnas = [
    { label: "N°", rowSpan: 3 },
    { label: "GRADO", rowSpan: 3 },
    { label: "DENUNCIADO(A)/PROCESADO(A)", rowSpan: 3 },
    { label: "UNIDAD POLICIAL", rowSpan: 3 },
    { label: "TIPIFICACIÓN (Art. / Inc.)", rowSpan: 3 },
    { label: "N° DE CASO", rowSpan: 3 },
    { label: "INVEST. ASIGNADO", rowSpan: 3 },
    { label: "FISCAL ASIGNADO", rowSpan: 3 },
    { label: "DEFENSA", rowSpan: 3 },

    {
      label: "ESTADO DEL CASO",
      colSpan: 20,
      subcolumnas: [

        { label: "FECHA RECEPCIÓN (DIDIPI)", rowSpan: 2 },
        { label: "FECHA SUBSANACIÓN (DIDIPI)", rowSpan: 2 },
        { label: "FECHA DESESTIMACIÓN (FISCALÍA)", rowSpan: 2},
        { label: "FECHA INICIO INVESTIGACIÓN", rowSpan: 2 },
        { label: "FECHA RECHAZO DENUNCIA", rowSpan: 2 },
        { label: "FECHA ACUSACIÓN FISCAL", rowSpan: 2},

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
          ]
        },

        {
          label: "SANCIONES",
          colSpan: 2,
          subcolumnas: [
            "RETIRO TEMPORAL (1-2 AÑOS)",
            "BAJA DEFINITIVA"
          ]
        },
        { label: "RESOLUCIÓN ABSOLUTORIA", rowSpan: 2 },
        { label: "EXTINCIÓN POR PRESCRIPCIÓN", rowSpan: 2 },
        { label: "EXTINCIÓN POR COSA JUZGADA", rowSpan: 2 },
        { label: "OTROS", rowSpan: 2 }
      ]
    },
    { label: "OBS.", rowSpan: 3 },
    { label: "ACCIONES", rowSpan: 3 }
  ];
 



  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const faltasData = await  obtenerFaltasGraves({
          nombre_policia: filtroNombre,
          unidad_policial: unidadSeleccionada,
          page: pageTodos
        });
        setFaltas(faltasData);
        console.log(faltasData);
      } catch (error) {
        console.error("Error cargando faltas graves:", error);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  },[unidadSeleccionada, filtroNombre, pageTodos]);

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

  async function EliminarEtapa() {
    if (!ultimaEtapa) {
      toast({
        title: "No hay etapa para eliminar",
        description: "Este registro no tiene etapas.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await eliminarEtapa(ultimaEtapa.id_etapa, user.id);

      toast({
        title: "Etapa eliminada",
        description: "La etapa se eliminó correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error?.response?.data?.detail || "No se pudo eliminar la etapa.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function ExtenderEtapa() {
    if (!ultimaEtapa) return;

    try {
      const res = await extenderEtapa(ultimaEtapa.id_etapa, user.id);
      
      toast({
        title: "Etapa extendida",
        description: "La fecha de vencimiento fue actualizada correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error(error);

      let msg = error?.response?.data?.detail;
      if (msg === "Etapa no encontrada") {
        toast({
          title: "Error",
          description: "La etapa no existe o ya fue eliminada.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } 
      else if (msg === "Etapa sin configuración de duración") {
        toast({
          title: "Configuración faltante",
          description: "Esta etapa no tiene duración definida en deadlines.json.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } 
      else if (msg === "No hay más extensiones disponibles") {
        toast({
          title: "Extensión no disponible",
          description: "Esta etapa ya no se puede extender más.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      } 
      else {
        toast({
          title: "Error inesperado",
          description: msg || "Ocurrió un error al extender la etapa.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }
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
        Faltas Graves
        <Flex align="center" gap={2}>
          {enviando && <Spinner size="sm" />}
          {enviado && !enviando && <Text ml={2}>✔️</Text>}  
          {(acciones.length > 0 || accionesEtapas.length > 0) && !enviando && (
            <Button
            bg="white"
            color="#2F6B2E" 
            _hover={{ bg: '#e6f2e6', transform: 'scale(1.03)' }}
            _active={{ bg: '#d6ead6' }}
            justifyContent="flex-start"
            fontWeight="semibold"
            borderRadius="lg"
            transition="all 0.15s"
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
        <Thead>
          {/* Fila 1 */}
          <Tr bg="blue.600">
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
          <Tr bg="blue.500">
            {columnas.flatMap((col, i) =>
              col.subcolumnas
                ? col.subcolumnas.map((sub, j) =>
                    typeof sub === "string" ? (
                      <Th key={`${i}-${j}`} color="white" textAlign="center" fontSize="sm">
                        {sub}
                      </Th>
                    ) : (
                      <Th
                        key={`${i}-${j}`}
                        colSpan={sub.colSpan || 1}
                        rowSpan={sub.rowSpan || 1}
                        textAlign="center"
                        color="white"
                        fontSize="sm"
                      >
                        {sub.label}
                      </Th>
                    )
                  )
                : col.rowSpan === 2
                ? null
                : null
            )}
          </Tr>
          {/* Fila 3 (sub-subcolumnas) */}
          <Tr bg="blue.400">
            {columnas.flatMap((col, i) =>
              col.subcolumnas
                ? col.subcolumnas.flatMap((sub, j) =>
                    typeof sub === "object" && sub.subcolumnas
                      ? sub.subcolumnas.map((subsub, k) => (
                          <Th
                            key={`${i}-${j}-${k}`}
                            color="white"
                            textAlign="center"
                            fontSize="xs"
                          >
                            {subsub}
                          </Th>
                        ))
                      : null
                  )
                : null
            )}
          </Tr>
        </Thead>

        <Tbody>
        {faltas.length > 0 ? (
            faltas.map((falta, index) => (
            <Tr
                key={falta.id_falta_grave}
                verticalAlign="middle"
                bg={tieneFoco === falta.id_falta_grave ? "yellow.50" : "transparent"}
                border={
                tieneFoco === falta.id_falta_grave ? "2px solid" : "none"
                }
                borderColor={
                tieneFoco === falta.id_falta_grave
                    ? "blue.300"
                    : "transparent"
                }
            >
                <Td>{index + 1}</Td>

                <Td>
                <AutoResizeTextarea
                    value={falta.grado || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(falta.id_falta_grave, "grado", e.target.value)
                    }
                />
                </Td>

                <Td>
                <ComboBoxAutoResize
                  value={falta.nombre}

                  onFocus={() => {
                    setTieneFoco(falta.id_falta_grave);
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
                      handleChangeFalta(falta.id_falta_grave, "nombre", val);
                      return;
                    }
                    const policia = policias.find(
                      (p) => p.nombre === val || `${p.nombre} (${p.grado})` === val
                    );

                    if (policia) {
                      handleChangeFalta(falta.id_falta_grave, "id_policia", policia.id_policia);
                      handleChangeFalta(falta.id_falta_grave, "nombre", policia.nombre);
                      handleChangeFalta(falta.id_falta_grave, "grado", policia.grado);
                      handleChangeFalta(falta.id_falta_grave, "unidad_policial", policia.unidad_policial);
                      setAcciones(prev => 
                        prev.map(a => 
                          a.id_falta_grave === falta.id_falta_grave 
                            ? { ...a, nuevo_policia: false }
                            : a
                        )
                      );
                    } else {
                      handleChangeFalta(falta.id_falta_grave, "nombre", val);
                    }
                  }}
                />
                </Td>
                <Td>
                  <Select
                    placeholder="Unidad policial"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.unidad_policial || ""}
                    onChange={(e) => handleChangeFalta(falta.id_falta_grave, "unidad_policial", e.target.value)}
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
                <AutoResizeTextarea
                    value={falta.tipificacion || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(falta.id_falta_grave, "tipificacion", e.target.value)
                    }
                />
                </Td>

                <Td>
                <AutoResizeTextarea
                    value={falta.nro_caso || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(falta.id_falta_grave, "nro_caso", e.target.value)
                    }
                />
                </Td>

                <Td>
                <AutoResizeTextarea
                    value={falta.investigador_asignado || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(
                        falta.id_falta_grave,
                        "investigador_asignado",
                        e.target.value
                    )
                    }
                />
                </Td>

                <Td>
                <AutoResizeTextarea
                    value={falta.fiscal_asignado || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(
                        falta.id_falta_grave,
                        "fiscal_asignado",
                        e.target.value
                    )
                    }
                />
                </Td>

                <Td>
                <AutoResizeTextarea
                    value={falta.defensa || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(falta.id_falta_grave, "defensa", e.target.value)
                    }
                />
                </Td>

                {/* FECHA RECEPCION (DIDIPI) */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA RECEPCION (DIDIPI)")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA RECEPCION (DIDIPI)", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA RECEPCION (DIDIPI)")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA RECEPCION (DIDIPI)", "descripcion", e.target.value)}
                  />
                </Td>

                {/* FECHA SUBSANACION (DIDIPI) */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA SUBSANACION (DIDIPI)")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA SUBSANACION (DIDIPI)", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA SUBSANACION (DIDIPI)")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA SUBSANACION (DIDIPI)", "descripcion", e.target.value)}
                  />
                </Td>

                {/* FECHA DESESTIMACION (FISCALIA) */}
                <Td>
                  <Input
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    type="date"
                    value={falta.etapas.find(e => e.nombre_etapa  === "FECHA DESESTIMACION (FISCALIA)")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA DESESTIMACION (FISCALIA)", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA DESESTIMACION (FISCALIA)")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA DESESTIMACION (FISCALIA)", "descripcion", e.target.value)}
                  />
                </Td>

                {/* FECHA INICIO INVESTIGACION */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA INICIO INVESTIGACION")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA INICIO INVESTIGACION", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA INICIO INVESTIGACION")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA INICIO INVESTIGACION", "descripcion", e.target.value)}
                  />
                </Td>

                {/* FECHA RECHAZO DENUNCIA */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA RECHAZO DENUNCIA")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA RECHAZO DENUNCIA", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA RECHAZO DENUNCIA")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA RECHAZO DENUNCIA", "descripcion", e.target.value)}
                  />
                </Td>

                {/* FECHA ACUSACION FISCAL */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA ACUSACION FISCAL")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA ACUSACION FISCAL", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "FECHA ACUSACION FISCAL")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "FECHA ACUSACION FISCAL", "descripcion", e.target.value)}
                  />
                </Td>

                {/* AUTO DE APERTURA */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "AUTO DE APERTURA")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "AUTO DE APERTURA", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "AUTO DE APERTURA")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "AUTO DE APERTURA", "descripcion", e.target.value)}
                  />
                </Td>

                {/* ALEGATOS INICIALES */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "ALEGATOS INICIALES")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "ALEGATOS INICIALES", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "ALEGATOS INICIALES")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "ALEGATOS INICIALES", "descripcion", e.target.value)}
                  />
                </Td>

                {/* INTERROGATORIO PROCESADO(A) */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "INTERROGATORIO PROCESADO(A)")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "INTERROGATORIO PROCESADO(A)", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "INTERROGATORIO PROCESADO(A)")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "INTERROGATORIO PROCESADO(A)", "descripcion", e.target.value)}
                  />
                </Td>

                {/* PRESENTACION DE PRUEBAS DE CARGO */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "PRESENTACION DE PRUEBAS DE CARGO")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "PRESENTACION DE PRUEBAS DE CARGO", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "PRESENTACION DE PRUEBAS DE CARGO")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "PRESENTACION DE PRUEBAS DE CARGO", "descripcion", e.target.value)}
                  />
                </Td>

                {/* PRESENTACION DE PRUEBAS DE DESCARGO */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "PRESENTACION DE PRUEBAS DE DESCARGO")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "PRESENTACION DE PRUEBAS DE DESCARGO", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "PRESENTACION DE PRUEBAS DE DESCARGO")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "PRESENTACION DE PRUEBAS DE DESCARGO", "descripcion", e.target.value)}
                  />
                </Td>

                {/* ALEGATOS FINALES */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "ALEGATOS FINALES")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "ALEGATOS FINALES", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "ALEGATOS FINALES")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "ALEGATOS FINALES", "descripcion", e.target.value)}
                  />
                </Td>

                {/* DELIBERACION Y LECTURA DE RESOLUCION */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "DELIBERACION Y LECTURA DE RESOLUCION")?.fecha_inicio || ""}
                    onChange={e =>
                      handleChangeEtapa(falta.id_falta_grave, "DELIBERACION Y LECTURA DE RESOLUCION", "fecha_inicio", e.target.value)
                    }
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "DELIBERACION Y LECTURA DE RESOLUCION")?.descripcion || ""}
                    onChange={e =>
                      handleChangeEtapa(falta.id_falta_grave, "DELIBERACION Y LECTURA DE RESOLUCION", "descripcion", e.target.value)
                    }
                  />
                </Td>

                {/* NOTIFICACION CON LA RESOLUCION DE 1 INSTANCIA */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "NOTIFICACION CON LA RESOLUCION DE 1 INSTANCIA")?.fecha_inicio || ""}
                    onChange={e =>
                      handleChangeEtapa(
                        falta.id_falta_grave,
                        "NOTIFICACION CON LA RESOLUCION DE 1 INSTANCIA",
                        "fecha_inicio",
                        e.target.value
                      )
                    }
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "NOTIFICACION CON LA RESOLUCION DE 1 INSTANCIA")?.descripcion || ""}
                    onChange={e =>
                      handleChangeEtapa(
                        falta.id_falta_grave,
                        "NOTIFICACION CON LA RESOLUCION DE 1 INSTANCIA",
                        "descripcion",
                        e.target.value
                      )
                    }
                  />
                </Td>

                {/* RETIRO TEMPORAL (1-2 ANOS) */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "RETIRO TEMPORAL (1-2 ANOS)")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "RETIRO TEMPORAL (1-2 ANOS)", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "RETIRO TEMPORAL (1-2 ANOS)")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "RETIRO TEMPORAL (1-2 ANOS)", "descripcion", e.target.value)}
                  />
                </Td>

                {/* BAJA DEFINITIVA */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "BAJA DEFINITIVA")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "BAJA DEFINITIVA", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "BAJA DEFINITIVA")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "BAJA DEFINITIVA", "descripcion", e.target.value)}
                  />
                </Td>

                {/* RESOLUCION ABSOLUTORIA */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "RESOLUCION ABSOLUTORIA")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "RESOLUCION ABSOLUTORIA", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "RESOLUCION ABSOLUTORIA")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "RESOLUCION ABSOLUTORIA", "descripcion", e.target.value)}
                  />
                </Td>

                {/* EXTINCION POR PRESCRIPCION */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "EXTINCION POR PRESCRIPCION")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "EXTINCION POR PRESCRIPCION", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "EXTINCION POR PRESCRIPCION")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "EXTINCION POR PRESCRIPCION", "descripcion", e.target.value)}
                  />
                </Td>

                {/* EXTINCION POR COSA JUZGADA */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "EXTINCION POR COSA JUZGADA")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "EXTINCION POR COSA JUZGADA", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "EXTINCION POR COSA JUZGADA")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "EXTINCION POR COSA JUZGADA", "descripcion", e.target.value)}
                  />
                </Td>

                {/* OTROS */}
                <Td>
                  <Input
                    type="date"
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "OTROS")?.fecha_inicio || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "OTROS", "fecha_inicio", e.target.value)}
                    variant="unstyled"
                    size="sm"
                    textAlign="center"
                  />
                  <AutoResizeTextarea
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    value={falta.etapas.find(e => e.nombre_etapa === "OTROS")?.descripcion || ""}
                    onChange={e => handleChangeEtapa(falta.id_falta_grave, "OTROS", "descripcion", e.target.value)}
                  />
                </Td>


                <Td>
                <AutoResizeTextarea
                    value={falta.observaciones || ""}
                    onFocus={() => setTieneFoco(falta.id_falta_grave)}
                    onChange={(e) =>
                    handleChangeFalta(falta.id_falta_grave, "observaciones", e.target.value)
                    }
                />
                </Td>
                <Td>
                  {tieneFoco === falta.id_falta_grave && (
                    <Flex gap={3}>
                      <Button size="sm" colorScheme="red" onClick={EliminarEtapa}>
                        Eliminar etapa
                      </Button>
                      <Button size="sm" colorScheme="blue" onClick={ExtenderEtapa}>
                        Extender etapa
                      </Button>

                      <Box fontWeight="bold" color={colorTiempo}>
                        {tiempoRestante}
                      </Box>
                    </Flex>
                  )}
                </Td>
            </Tr>
            ))
        ) : (
            <Tr>
            <Td colSpan={columnas.length} textAlign="center" py={4} color="black.900" fontSize="lg">
                No hay faltas registradas para {unidadSeleccionada}.
            </Td>
            </Tr>
        )}

        <Tr bg="gray.50">
            <Td colSpan={columnas.length} textAlign="center">
            <Button
                colorScheme="blue"
                size="sm"
                onClick={() => {
                const nueva = {
                    id_falta_grave: Date.now(),
                    nombre: "",
                    grado: "",
                    unidad_policial: "",
                    tipificacion: "",
                    nro_caso: "",
                    investigador_asignado: "",
                    fiscal_asignado: "",
                    defensa: "",
                    etapas: [],
                    observaciones: "",
                    id_policia: null,
                };
                setFaltas((prev) => [...prev, nueva]);
                agregarAccion(nueva.id_falta_grave, true, true);
                setTieneFoco(nueva.id_falta_grave);
                }}
            >
                ➕ Agregar nueva falta grave
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
      onClick={() => exportExcelFaltasGraves(
        [
        { label: "N°", rowSpan: 3 },
        { label: "GRADO", rowSpan: 3 },
        { label: "DENUNCIADO(A)/PROCESADO(A)", rowSpan: 3 },
        { label: "UNIDAD POLICIAL", rowSpan: 3 },
        { label: "TIPIFICACIÓN (Art. / Inc.)", rowSpan: 3 },
        { label: "N° DE CASO", rowSpan: 3 },
        { label: "INVEST. ASIGNADO", rowSpan: 3 },
        { label: "FISCAL ASIGNADO", rowSpan: 3 },
        { label: "DEFENSA", rowSpan: 3 },

        {
          label: "ESTADO DEL CASO",
          colSpan: 20,
          subcolumnas: [

            { label: "FECHA RECEPCIÓN (DIDIPI)", rowSpan: 2 },
            { label: "FECHA SUBSANACIÓN (DIDIPI)", rowSpan: 2 },
            { label: "FECHA DESESTIMACIÓN (FISCALÍA)", rowSpan: 2},
            { label: "FECHA INICIO INVESTIGACIÓN", rowSpan: 2 },
            { label: "FECHA RECHAZO DENUNCIA", rowSpan: 2 },
            { label: "FECHA ACUSACIÓN FISCAL", rowSpan: 2},

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
              ]
            },

            {
              label: "SANCIONES",
              colSpan: 2,
              subcolumnas: [
                "RETIRO TEMPORAL (1-2 AÑOS)",
                "BAJA DEFINITIVA"
              ]
            },
            { label: "RESOLUCIÓN ABSOLUTORIA", rowSpan: 2 },
            { label: "EXTINCIÓN POR PRESCRIPCIÓN", rowSpan: 2 },
            { label: "EXTINCIÓN POR COSA JUZGADA", rowSpan: 2 },
            { label: "OTROS", rowSpan: 2 }
          ]
        },
        { label: "OBS.", rowSpan: 3 },
      ], 
      faltas, 
      "FaltasGraves",
      [{title:"SEGUIMIENTO Y CONTROL DE FALTAS GRAVES DE INICIO, REMITIDO AL T.D.D., RECHAZO Y PROCESO DE INVESTIGACION VIG. " + new Date().getFullYear(),col:0,colSpan:30}])}
    >
      Exportar Excel
    </Button>
    </Box>
  );
}
 