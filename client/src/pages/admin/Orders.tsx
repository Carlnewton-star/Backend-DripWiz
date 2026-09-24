import { Fragment, useEffect, useState } from "react";
import { fetchAllOrders, updateOrderStatus, deleteOrderAdmin, type AdminOrder } from "../../api/orders";
import { ApiError } from "../../api/client";

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchAllOrders()
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load orders."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggle(order: AdminOrder, field: "isPaid" | "isDelivered") {
    try {
      await updateOrderStatus(order._id, { [field]: !order[field] });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update order.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this order? This can't be undone.")) return;
    try {
      await deleteOrderAdmin(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete order.");
    }
  }

  return (
    <div className="admin-page">
      <h1>Orders</h1>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">No orders yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Delivered</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const customer = typeof o.user === "string" ? o.user : o.user?.name;
              return (
                <Fragment key={o._id}>
                  <tr>
                    <td>
                      <button
                        className="admin-link-btn"
                        onClick={() => setExpandedId(expandedId === o._id ? null : o._id)}
                      >
                        {o._id.slice(-8)}
                      </button>
                    </td>
                    <td>{customer ?? "—"}</td>
                    <td>${o.totalPrice.toFixed(2)}</td>
                    <td>
                      <button
                        className={`admin-badge ${o.isPaid ? "admin-badge--good" : "admin-badge--muted"}`}
                        onClick={() => toggle(o, "isPaid")}
                      >
                        {o.isPaid ? "Paid" : "Unpaid"}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`admin-badge ${o.isDelivered ? "admin-badge--good" : "admin-badge--muted"}`}
                        onClick={() => toggle(o, "isDelivered")}
                      >
                        {o.isDelivered ? "Delivered" : "Pending"}
                      </button>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="admin-link-btn admin-link-btn--danger" onClick={() => handleDelete(o._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedId === o._id && (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-order-detail">
                          <p>
                            <strong>Shipping:</strong> {o.shippingAddress.address}, {o.shippingAddress.city},{" "}
                            {o.shippingAddress.postalCode}, {o.shippingAddress.country}
                          </p>
                          <ul>
                            {o.products.map((item, i) => {
                              const name = typeof item.product === "string" ? item.product : item.product.name;
                              return (
                                <li key={i}>
                                  {name} × {item.quantity} — ${item.price.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
