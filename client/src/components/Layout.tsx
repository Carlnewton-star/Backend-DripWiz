import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const { count } = useCart();

  return (
    <>
      <header className="site-header">
        <div className="container site-header__bar">
          <NavLink to="/" className="logo">
            Drip<span>Wiz</span>
          </NavLink>
          <nav className="site-nav">
            <NavLink to="/shop" className={({ isActive }) => (isActive ? "active" : "")}>
              Shop
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/account" className={({ isActive }) => (isActive ? "active" : "")}>
                  Account
                </NavLink>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  href="/"
                >
                  Sign out
                </a>
              </>
            ) : (
              <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
                Sign in
              </NavLink>
            )}
            <NavLink to="/cart" className="site-nav__cart">
              Bag
              {count > 0 && <span className="site-nav__cart-count">{count}</span>}
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__grid">
            <div>
              <div className="logo" style={{ fontSize: "1.3rem", marginBottom: 12 }}>
                Drip<span>Wiz</span>
              </div>
              <p style={{ maxWidth: 320, fontSize: "0.9rem" }}>
                Curated classic and trending pieces, selected by our stylists —
                fashion that holds up past one season.
              </p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li>
                  <NavLink to="/shop">All pieces</NavLink>
                </li>
                <li>
                  <NavLink to="/shop?category=Dresses">Dresses</NavLink>
                </li>
                <li>
                  <NavLink to="/shop?category=Outerwear">Outerwear</NavLink>
                </li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li>
                  <NavLink to="/account">Order history</NavLink>
                </li>
                <li>
                  <NavLink to="/login">Sign in</NavLink>
                </li>
              </ul>
            </div>
          </div>
          <div className="site-footer__bottom">
            <span>© {new Date().getFullYear()} DripWiz</span>
            <span>Curated fashion, no fast-fashion filler.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
