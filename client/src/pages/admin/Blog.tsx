import { useEffect, useState, type FormEvent } from "react";
import { fetchAdminPosts, createPost, updatePost, deletePost, type BlogPost, type BlogPostInput } from "../../api/blog";
import { ApiError } from "../../api/client";

const emptyForm: BlogPostInput = {
  title: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  author: "DripWiz",
  status: "draft",
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BlogPostInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetchAdminPosts()
      .then((res) => setPosts(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load posts."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(p: BlogPost) {
    setEditingId(p._id);
    setForm({
      title: p.title,
      excerpt: p.excerpt ?? "",
      body: p.body,
      coverImageUrl: p.coverImageUrl ?? "",
      author: p.author,
      status: p.status,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) await updatePost(editingId, form);
      else await createPost(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save post.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete post.");
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Blog</h1>
        <button className="btn btn-primary" onClick={startCreate}>
          + New post
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit post" : "New post"}</h2>
          <div className="admin-form-grid">
            <div className="field field--full">
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field field--full">
              <label>Excerpt</label>
              <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="field field--full">
              <label>Body</label>
              <textarea required rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="field">
              <label>Cover image URL</label>
              <input value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
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
      ) : posts.length === 0 ? (
        <p className="admin-empty">No posts yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p._id}>
                <td>{p.title}</td>
                <td>
                  <span className={`admin-badge ${p.status === "published" ? "admin-badge--good" : "admin-badge--muted"}`}>
                    {p.status}
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
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
