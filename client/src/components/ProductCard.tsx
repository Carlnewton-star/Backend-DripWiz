import { Link } from "react-router-dom";
import type { Product } from "../api/products";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.url;

  return (
    <Link to={`/shop/${product._id}`} className="product-card">
      <div className="product-card__image">
        {image ? <img src={image} alt={product.name} /> : <span>DripWiz</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__price">KSh {product.price.toLocaleString()}</div>
      </div>
    </Link>
  );
}
