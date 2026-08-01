import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyOrders, type Order } from "../api/orders";

export default function Account() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMyOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setError("Couldn't load your orders right now."));
  }, [isAuthenticated]);

  if (isLoading) {
    return <p className="loading">Loading…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: "/account" }} replace />;
  }

  return (
    <div className="container" style={{ padding: "56px 0" }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Account</span>
          <h2>Hi, {user?.name}</h2>
        </div>
      </div>

      <h3 style={{ marginBottom: 20, fontSize: "1.2rem" }}>Order history</h3>

      {error && <p className="error-text">{error}</p>}
      {!error && !orders && <p className="loading">Loading orders…</p>}
      {orders && orders.length === 0 && (
        <div className="empty-state">
          No orders yet. <Link to="/shop">Start shopping.</Link>
        </div>
      )}
      {orders &&
        orders.map((order) => (
          <div className="order-card" key={order._id}>
            <div className="order-card__head">
              <span>Order #{order._id.slice(-6).toUpperCase()}</span>
              <span className={`badge ${order.isPaid ? "paid" : "pending"}`}>
                {order.isPaid ? "Paid" : "Pending payment"}
              </span>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--color-paper-dim)" }}>
              {new Date(order.createdAt).toLocaleDateString()} ·{" "}
              {order.products.length} item{order.products.length > 1 ? "s" : ""} · KSh{" "}
              {order.totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
    </div>
  );
}
