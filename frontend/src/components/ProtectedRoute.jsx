import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "./Loader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return <Loader text="Authenticating..." />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(role))
    return <Navigate to="/unauthorized" replace />;

  return children;
}
