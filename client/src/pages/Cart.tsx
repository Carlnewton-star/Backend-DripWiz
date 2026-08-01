import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../api/orders";
import { ApiError } from "../api/client";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taxPrice = subtotal * 0.15;
  const totalPrice = subtotal + taxPrice;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createOrder({
        products: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: { address, city, postalCode, country },
        paymentMethod,
      });
      clear();
      navigate("/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-state">
          Your bag is empty. <Link to="/shop">Go find something.</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="section-head">
        <div>
          <span className="eyebrow">Your bag</span>
          <h2>{items.length} piece{items.length > 1 ? "s" : ""}</h2>
        </div>
      </div>

      {items.map((item) => (
        <div className="cart-row" key={item.product._id}>
          <div className="cart-row__image">
            {item.product.images?.[0]?.url && (
              <img src={item.product.images[0].url} alt={item.product.name} />
            )}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>
              {item.product.name}
            </div>
            <div className="product-card__price">
              KSh {item.product.price.toLocaleString()}
            </div>
          </div>
          <div className="qty-control">
            <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>
              −
            </button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>
              +
            </button>
          </div>
          <button className="btn btn-ghost" onClick={() => removeItem(item.product._id)}>
            Remove
          </button>
        </div>
      ))}

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Subtotal</span>
          <span>KSh {subtotal.toLocaleString()}</span>
        </div>
        <div className="cart-summary__row">
          <span>Tax (15%)</span>
          <span>KSh {taxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="cart-summary__row total">
          <span>Total</span>
          <span>KSh {totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <form onSubmit={handleCheckout} style={{ marginTop: 40, maxWidth: 480 }}>
        <h3 style={{ marginBottom: 20, fontSize: "1.3rem" }}>Shipping details</h3>
        {error && <div className="form-error">{error}</div>}

        <div className="field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="postalCode">Postal code</label>
          <input
            id="postalCode"
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="country">Country</label>
          <input
            id="country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="paymentMethod">Payment method</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="card">Card</option>
            <option value="mpesa">M-Pesa</option>
          </select>
        </div>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Placing order…" : isAuthenticated ? "Place order" : "Sign in to check out"}
        </button>
        {!isAuthenticated && (
          <p className="form-note">
            You'll need to <Link to="/login">sign in</Link> before placing an order.
          </p>
        )}
      </form>
    </div>
  );
}
