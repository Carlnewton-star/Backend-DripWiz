import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllOrders, fetchSalesStats, type AdminOrder, type SalesStats } from "../../api/orders";
import { fetchLowStock } from "../../api/stock";
import type { Product } from "../../api/products";
import { ApiError } from "../../api/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchSalesStats(), fetchLowStock(), fetchAllOrders()])
      .then(([statsRes, lowStockRes, ordersRes]) => {
        setStats(statsRes.data);
        setLowStock(lowStockRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Orders</span>
          <span className="admin-stat-value">{stats?.numOrders ?? 0}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total sales</span>
          <span className="admin-stat-value">${(stats?.totalSales ?? 0).toFixed(2)}</span>
        </div>
        <div className="admin-stat-card admin-stat-card--warn">
          <span className="admin-stat-label">Low stock items</span>
          <span className="admin-stat-value">{lowStock.length}</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Recent orders</h2>
          <Link to="/admin/orders">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="admin-empty">No orders yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Delivered</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o._id}>
                  <td>{o._id.slice(-8)}</td>
                  <td>${o.totalPrice.toFixed(2)}</td>
                  <td>{o.isPaid ? "Yes" : "No"}</td>
                  <td>{o.isDelivered ? "Yes" : "No"}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Low stock</h2>
            <Link to="/admin/stock">Manage stock →</Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
