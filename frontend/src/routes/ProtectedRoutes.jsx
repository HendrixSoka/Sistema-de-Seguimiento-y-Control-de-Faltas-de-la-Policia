import { Navigate } from "react-router-dom";
import { getUserDataFromToken } from "../api/auth";

export default function ProtectedRoute({ children, roles }) {
  const userData = getUserDataFromToken();

  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(userData.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
