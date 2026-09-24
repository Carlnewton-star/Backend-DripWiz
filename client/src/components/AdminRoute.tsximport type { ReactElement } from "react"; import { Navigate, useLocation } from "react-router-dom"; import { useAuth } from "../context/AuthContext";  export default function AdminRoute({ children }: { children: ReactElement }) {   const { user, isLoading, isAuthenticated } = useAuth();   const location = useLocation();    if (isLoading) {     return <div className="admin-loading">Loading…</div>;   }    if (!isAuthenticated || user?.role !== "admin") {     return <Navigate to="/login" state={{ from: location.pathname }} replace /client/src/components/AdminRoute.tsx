import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }: { children: ReactElement }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="admin-loading">Loading…</div>;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

