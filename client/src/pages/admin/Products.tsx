import { useEffect, useState, type FormEvent } from "react";
import {
  fetchAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductPhoto,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductInput,
} from "../../api/products";
import { ApiError } from "../../api/client";

const emptyForm: ProductInput = {
  name: "",
  price: 0,
  description: "",
  category: PRODUCT_CATEGORIES[0],
  stock: 0,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  function load() {
    setLoading(true);
    fetchAllProductsAdmin()
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load products."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setShowForm(true);
  }

  function startEdit(p: Product) {
    setEditingId(p._id);
    setForm({ name: p.name, price: p.price, description: p.description, category: p.category, stock: p.stock });
    setPhotoFile(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let productId = editingId;
      if (editingId) {
        await updateProduct(editingId, form);
      } else {
        const res = await createProduct(form);
        productId = res.data._id;
      }
      if (photoFile && productId) {
        await uploadProductPhoto(productId, photoFile);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this product? This can't be undone.")) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete product.");
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={startCreate}>
          + New product
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit product" : "New product"}</h2>
          <div className="admin-form-grid">
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Price</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Stock</label>
              <input
                required
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </div>
            <div className="field field--full">
              <label>Description</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field field--full">
              <label>Photo{editingId ? "" : " (added after the product is created)"}</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="admin-form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <p className="admin-empty">No products yet. Add your first one above.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>${p.price.toFixed(2)}</td>
                <td className={p.stock <= 10 ? "admin-cell-warn" : ""}>{p.stock}</td>
                <td className="admin-row-actions">
                  <button className="admin-link-btn" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="admin-link-btn admin-link-btn--danger" onClick={() => handleDelete(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
