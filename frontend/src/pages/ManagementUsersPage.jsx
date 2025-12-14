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
  Input,
  Button,
  useToast,
  Spinner,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { CheckIcon, DeleteIcon, AddIcon, CloseIcon } from "@chakra-ui/icons";
import { obtenerUsuarios,registrarUsuario, actualizarUsuario,eliminarUsuario } from "../api/auth";
import api from "../api/axiosInstance"; 

export default function ManagementUsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const toast = useToast();
  useEffect(() => {
    async function fetchUsuarios() {
        try {
        const data = await obtenerUsuarios();
        setUsuarios(data);
        } catch (err) {
        toast({
            title: "Error al cargar usuarios",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        } finally {
        setCargando(false);
        }
    }

    fetchUsuarios();
    }, []);


  const handleChange = (id, campo, valor) => {
    if (id === "nuevo") {
      setNuevo({ ...nuevo, [campo]: valor });
    } else {
      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === id ? { ...u, [campo]: valor, modificado: true } : u))
      );
    }
  };

  const handleActualizar = async (id) => {
    const usuario = usuarios.find((u) => u.id_usuario === id);
    try {
      await actualizarUsuario(id, usuario);
      toast({
        title: "Usuario actualizado correctamente",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === id ? { ...u, modificado: false } : u))
      );
    } catch (err) {
      toast({
        title: "Error al actualizar",
        description: err.response?.data?.detail || "Error desconocido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarUsuario(id);
      const data = await obtenerUsuarios();
      setUsuarios(data);
      toast({
        title: "Usuario eliminado",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error al eliminar",
        description: err.response?.data?.detail || "Error desconocido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCrear = async () => {
    try {
      const creado = await registrarUsuario(nuevo);
      setUsuarios([...usuarios, creado]);
      setNuevo(null);
      toast({
        title: "Usuario creado correctamente",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error al crear usuario",
        description: err.response?.data?.detail || "Error desconocido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAgregarFila = () => {
    setNuevo({
      nombre: "",
      cargo: "",
      rol: "",
      secret_name: "",
    });
  };

  if (cargando) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" color="green.400" />
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Heading mb={6} color="green.700">
        Gestionar Usuarios
      </Heading>

      <Table variant="simple" size="md" bg="green.50" borderRadius="xl" shadow="sm">
        <Thead bg="green.100">
          <Tr>
            <Th>ID</Th>
            <Th>Nombre</Th>
            <Th>Cargo</Th>
            <Th>Rol</Th>
            <Th>Contraseña</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {usuarios.map((u) => (
            <Tr key={u.id_usuario}>
              <Td>{u.id_usuario}</Td>
              <Td>
                <Input
                  value={u.nombre}
                  variant="filled"
                  bg="green.100"
                  onChange={(e) => handleChange(u.id_usuario, "nombre", e.target.value)}
                />
              </Td>
              <Td>
                <Input
                  value={u.cargo}
                  variant="filled"
                  bg="green.100"
                  onChange={(e) => handleChange(u.id_usuario, "cargo", e.target.value)}
                />
              </Td>
              <Td>
                <Select
                  value={u.rol}
                  variant="filled"
                  bg="green.100"
                  onChange={(e) => handleChange(u.id_usuario, "rol", e.target.value)}
                >
                  <option value="Supervisor">Supervisor</option>
                  <option value="Editor">Editor</option>
                  <option value="Lector">Lector</option>
                </Select>
              </Td>
              <Td>
                <Input
                    value={u.user_name || ""}
                    variant="filled"
                    bg="green.100"
                    onChange={(e) => handleChange(u.id_usuario, "user_name", e.target.value)}
                />
              </Td>
              <Td>
                <Input
                    type="password"
                    placeholder="*************"
                    value={u.secret_name || ""}
                    onChange={(e) => handleChange(u.id_usuario, "secret_name", e.target.value)}
                />
              </Td>
              <Td>
                {u.modificado ? (
                  <IconButton
                    icon={<CheckIcon />}
                    colorScheme="green"
                    mr={2}
                    onClick={() => handleActualizar(u.id_usuario)}
                    title="Actualizar"
                  />
                ) : null}
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleEliminar(u.id_usuario)}
                  title="Eliminar"
                />
              </Td>
            </Tr>
          ))}

          {/* Fila de nuevo usuario */}
          {nuevo && (
            <Tr bg="green.50">
              <Td>—</Td>
              <Td>
                <Input
                  placeholder="Nombre"
                  value={nuevo.nombre}
                  onChange={(e) => handleChange("nuevo", "nombre", e.target.value)}
                />
              </Td>
              <Td>
                <Input
                  placeholder="Cargo"
                  value={nuevo.cargo}
                  onChange={(e) => handleChange("nuevo", "cargo", e.target.value)}
                />
              </Td>
              <Td>
                <Select
                  value={nuevo.rol}
                  variant="filled"
                  bg="green.100"
                  onChange={(e) => handleChange("nuevo", "rol", e.target.value)}
                >
                  <option value="Supervisor">Supervisor</option>
                  <option value="Editor">Editor</option>
                  <option value="Lector">Lector</option>
                </Select>
              </Td>
              <Td>
                <Input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={nuevo.secret_name }
                    onChange={(e) => handleChange("nuevo", "secret_name", e.target.value)}
                />
              </Td>
              <Td>
                <IconButton
                  icon={<CheckIcon />}
                  colorScheme="green"
                  mr={2}
                  onClick={handleCrear}
                  title="Crear"
                />
                <IconButton
                  icon={<CloseIcon />}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setNuevo(null)}
                  title="Cancelar"
                />
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {/* Botón agregar usuario */}
      {!nuevo && (
        <Button
          leftIcon={<AddIcon />}
          colorScheme="green"
          variant="solid"
          mt={4}
          onClick={handleAgregarFila}
        >
          Añadir usuario
        </Button>
      )}
    </Box>
  );
}
