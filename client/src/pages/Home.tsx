import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, type Product } from "../api/products";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((res) => setProducts(res.data.slice(0, 8)))
      .catch(() => setError("Couldn't load pieces right now."));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero__eyebrow">Curated fashion</span>
          <h1>Classic pieces. Trending pieces. No filler.</h1>
          <p>
            DripWiz is a curated storefront — every piece is chosen by a stylist,
            not an algorithm. Built for a wardrobe that outlasts the season it
            was bought in.
          </p>
          <div className="hero__actions">
            <Link to="/shop" className="btn btn-primary">
              Shop the collection
            </Link>
            <Link to="/shop?category=Outerwear" className="btn btn-ghost">
              Outerwear
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Just in</span>
              <h2>New this week</h2>
            </div>
            <Link to="/shop" className="btn btn-ghost">
              View all
            </Link>
          </div>

          {error && <p className="error-text">{error}</p>}
          {!error && !products && <p className="loading">Loading pieces…</p>}
          {products && products.length === 0 && (
            <div className="empty-state">
              No pieces are live yet — check back shortly.
            </div>
          )}
          {products && products.length > 0 && (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
