import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "./Loader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const auth = useAuth();

  if (auth.loading) return <Loader text="Authenticating..." />;

  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(auth.role))
    return <Navigate to="/unauthorized" replace />;

  return children;
}
