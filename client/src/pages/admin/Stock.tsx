import { useEffect, useState, type FormEvent } from "react";
import { fetchLowStock, fetchMovements, recordMovement, type StockMovement } from "../../api/stock";
import { fetchAllProductsAdmin, type Product } from "../../api/products";
import { ApiError } from "../../api/client";

export default function AdminStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"restock" | "adjustment" | "return">("restock");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([fetchAllProductsAdmin(), fetchLowStock(), fetchMovements()])
      .then(([p, low, mv]) => {
        setProducts(p.data);
        setLowStock(low.data);
        setMovements(mv.data);
        setProductId((current) => current || (p.data.length ? p.data[0]._id : ""));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load stock data."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    setError(null);
    try {
      await recordMovement({ productId, type, quantity, note: note || undefined });
      setQuantity(1);
      setNote("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't record movement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <h1>Stock</h1>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel">
        <h2>Record a movement</h2>
        <form className="admin-form admin-form--inline" onSubmit={handleSubmit}>
          <div className="field">
            <label>Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (stock: {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
          </div>
          <div className="field">
            <label>Quantity</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="field field--full">
            <label>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving || !productId}>
            {saving ? "Saving…" : "Record movement"}
          </button>
        </form>
      </div>

      {lowStock.length > 0 && (
        <div className="admin-panel">
          <h2>Low stock</h2>
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

      <div className="admin-panel">
        <h2>Recent movements</h2>
        {loading ? (
          <p>Loading…</p>
        ) : movements.length === 0 ? (
          <p className="admin-empty">No stock movements yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Qty</th>
                <th>Resulting stock</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m._id}>
                  <td>{m.type}</td>
                  <td>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td>{m.resultingStock}</td>
                  <td>{m.note ?? "—"}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
