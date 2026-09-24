import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles-admin.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>DripWiz</h2>
          <p>Admin</p>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className="admin-nav-item">
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className="admin-nav-item">
            Products
          </NavLink>
          <NavLink to="/admin/orders" className="admin-nav-item">
            Orders
          </NavLink>
          <NavLink to="/admin/stock" className="admin-nav-item">
            Stock
          </NavLink>
          <NavLink to="/admin/blog" className="admin-nav-item">
            Blog
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <span>{user?.name}</span>
          <button className="admin-link-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
