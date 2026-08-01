import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct, type Product } from "../api/products";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    setProduct(null);
    setAdded(false);
    fetchProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => setError("This piece couldn't be found."));
  }, [id]);

  if (error) {
    return (
      <div className="container">
        <p className="error-text">{error}</p>
        <Link to="/shop" className="btn btn-ghost">
          Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <p className="loading">Loading…</p>
      </div>
    );
  }

  const image = product.images?.[0]?.url;
  const outOfStock = product.stock <= 0;

  return (
    <div className="container">
      <div className="product-detail">
        <div className="product-detail__image">
          {image ? <img src={image} alt={product.name} /> : null}
        </div>
        <div>
          <span className="product-card__category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="product-detail__price">KSh {product.price.toLocaleString()}</div>
          <p className="product-detail__description">{product.description}</p>
          <div className="product-detail__stock">
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </div>

          {!outOfStock && (
            <div className="qty-row">
              <div className="qty-control">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={outOfStock}
            onClick={() => {
              addItem(product, quantity);
              setAdded(true);
            }}
          >
            {outOfStock ? "Out of stock" : added ? "Added to bag ✓" : "Add to bag"}
          </button>
        </div>
      </div>
    </div>
  );
}
