import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "96px 0", textAlign: "center" }}>
      <h1>404</h1>
      <p style={{ color: "var(--color-paper-dim)", margin: "16px 0 32px" }}>
        This piece isn't in the collection.
      </p>
      <Link to="/" className="btn btn-primary">
        Back home
      </Link>
    </div>
  );
}
