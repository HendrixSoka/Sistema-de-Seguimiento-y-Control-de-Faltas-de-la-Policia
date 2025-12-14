import { Routes, Route ,Navigate} from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import FaltaGraves from '../pages/FaltaGravesPage';
import FaltasLeves from '../pages/FaltaLevesPage';
import Delitos from '../pages/DelitosPage';
import Usuarios from '../pages/ManagementUsersPage';
import HistorialCambios from '../pages/LogsPage';
import ProtectedRoute from './ProtectedRoutes';
export default function AppRoutes() {
  return (
    <Routes>
      {/* Redirige por defecto al login */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* RUTA PÚBLICA */}
      <Route path="/login" element={<LoginPage />} />

      {/* RUTAS PROTEGIDAS */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faltas-leves"
        element={
          <ProtectedRoute>
            <FaltasLeves />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faltas-graves"
        element={
          <ProtectedRoute>
            <FaltaGraves />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delitos"
        element={
          <ProtectedRoute>
            <Delitos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute roles={["Supervisor"]}>
            <Usuarios />
          </ProtectedRoute>
        }
      />

      <Route
        path="/historial"
        element={
          <ProtectedRoute roles={["Supervisor"]}>
            <HistorialCambios />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}