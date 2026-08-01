import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts, PRODUCT_CATEGORIES, type Product } from "../api/products";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts(null);
    fetchProducts(activeCategory ? { category: activeCategory } : undefined)
      .then((res) => setProducts(res.data))
      .catch(() => setError("Couldn't load pieces right now."));
  }, [activeCategory]);

  function setCategory(category: string) {
    if (category) setSearchParams({ category });
    else setSearchParams({});
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Shop</span>
            <h2>{activeCategory || "All pieces"}</h2>
          </div>
        </div>

        <div className="filter-bar">
          <button
            className={`filter-chip ${activeCategory === "" ? "active" : ""}`}
            onClick={() => setCategory("")}
          >
            All
          </button>
          {PRODUCT_CATEGORIES.map((category) => (
            <button
              key={category}
              className={`filter-chip ${activeCategory === category ? "active" : ""}`}
              onClick={() => setCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}
        {!error && !products && <p className="loading">Loading pieces…</p>}
        {products && products.length === 0 && (
          <div className="empty-state">No pieces found in this category yet.</div>
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
  );
}
