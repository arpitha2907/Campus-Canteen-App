import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getMenu, getPeakHours } from "../api/index";
import "./MenuPage.css";

export default function MenuPage() {
  const { user, logout }                    = useAuth();
  const { cart, addToCart, updateCartQty,
          cartTotal, cartCount, clearCart }  = useCart();
  const navigate                            = useNavigate();

  const [menu,     setMenu]     = useState([]);
  const [category, setCategory] = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [peak,     setPeak]     = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

  // fetch menu
  useEffect(() => {
    fetchMenu();
    fetchPeak();
  }, [category]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await getMenu(category === "all" ? "" : category);
      setMenu(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeak = async () => {
    try {
      const res = await getPeakHours();
      setPeak(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getCartQty = (id) => {
    const item = cart.find(i => i._id === id);
    return item ? item.cartQty : 0;
  };

  const getStockColor = (qty) => {
    if (qty === 0)  return "#ef4444";
    if (qty <= 10)  return "#f97316";
    return "#22c55e";
  };

  const getStockLabel = (qty) => {
    if (qty === 0)  return "Out of Stock";
    if (qty <= 10)  return `Only ${qty} left!`;
    return `${qty} available`;
  };

  return (
    <div className="menu-page">

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">🍽️</span>
          <div>
            <p className="navbar-title">Campus Canteen</p>
            <p className="navbar-sub">
              Hey, {user?.name?.split(" ")[0]}!
              {user?.userType === "college" && (
                <span className="points-badge">⭐ {user?.rewardPoints || 0} pts</span>
              )}
            </p>
          </div>
        </div>
        <div className="navbar-right">
          <button className="cart-btn" onClick={() => setShowCart(true)}>
            🛒
            {cartCount > 0 && (
              <span className="cart-count">{cartCount}</span>
            )}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── PEAK HOURS BANNER ── */}
      {peak?.isPeak && (
        <div className="peak-banner">
          ⏰ Peak Hours Active — Estimated delay: {peak.estimatedDelay} minutes
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        {[
          { key: "menu",       icon: "🍽️", label: "Menu"      },
          { key: "orders",     icon: "📦", label: "Orders"    },
          { key: "rewards",    icon: "⭐", label: "Rewards"   },
          { key: "complaints", icon: "💬", label: "Feedback"  },
        ].map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "nav-tab active" : "nav-tab"}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "menu") navigate(`/${tab.key}`);
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="menu-content">

        {/* ── CATEGORY FILTER ── */}
        <div className="category-bar">
          {[
            { val: "all",     label: "🍽️ All"       },
            { val: "cooked",  label: "🔥 Cooked"    },
            { val: "packed",  label: "📦 Packed"    },
            { val: "healthy", label: "🥗 Healthy"   },
          ].map(c => (
            <button
              key={c.val}
              className={category === c.val ? "cat-btn active" : "cat-btn"}
              onClick={() => setCategory(c.val)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ── MENU ITEMS ── */}
        {loading ? (
          <div className="loading-box">Loading menu...</div>
        ) : menu.length === 0 ? (
          <div className="empty-box">
            <p>😔 No items found in this category</p>
          </div>
        ) : (
          <div className="menu-grid">
            {menu.map(item => {
              const qty = getCartQty(item._id);
              const outOfStock = item.quantity === 0 || !item.isAvailable;

              return (
                <div
                  key={item._id}
                  className={outOfStock ? "menu-card disabled" : "menu-card"}
                >
                  {/* emoji */}
                  <div className="item-emoji">{item.emoji}</div>

                  {/* info */}
                  <div className="item-info">
                    <div className="item-top">
                      <h3 className="item-name">{item.name}</h3>
                      <span className="item-price">₹{item.price}</span>
                    </div>
                    <p className="item-desc">{item.description}</p>

                    {/* tags */}
                    <div className="item-tags">
                      <span className={`tag tag-${item.category}`}>
                        {item.category === "cooked"  ? "🔥 Cooked"  :
                         item.category === "packed"  ? "📦 Packed"  : "🥗 Healthy"}
                      </span>
                      {item.isVeg && (
                        <span className="tag tag-veg">🟢 Veg</span>
                      )}
                      {item.calories > 0 && (
                        <span className="tag tag-cal">🔥 {item.calories} cal</span>
                      )}
                    </div>

                    {/* stock */}
                    <p
                      className="stock-label"
                      style={{ color: getStockColor(item.quantity) }}
                    >
                      ● {getStockLabel(item.quantity)}
                    </p>

                    {/* add to cart */}
                    {outOfStock ? (
                      <div className="unavailable-btn">Unavailable</div>
                    ) : qty === 0 ? (
                      <button
                        className="add-btn"
                        onClick={() => addToCart(item)}
                      >
                        + Add to Cart
                      </button>
                    ) : (
                      <div className="qty-control">
                        <button onClick={() => updateCartQty(item._id, qty - 1)}>−</button>
                        <span>{qty}</span>
                        <button
                          onClick={() => {
                            if (qty < item.quantity) updateCartQty(item._id, qty + 1);
                          }}
                          disabled={qty >= item.quantity}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CART DRAWER ── */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>

            <div className="cart-header">
              <h3>🛒 Your Cart {cartCount > 0 && `(${cartCount})`}</h3>
              <button onClick={() => setShowCart(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <p>🛒</p>
                <p>Your cart is empty</p>
                <p>Add items from the menu!</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {peak?.isPeak && (
                    <div className="peak-notice">
                      ⏰ Peak hours — ~{peak.estimatedDelay} min delay expected
                    </div>
                  )}
                  {cart.map(item => (
                    <div key={item._id} className="cart-item">
                      <span className="cart-item-emoji">{item.emoji}</span>
                      <div className="cart-item-info">
                        <p>{item.name}</p>
                        <p>₹{item.price} each</p>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateCartQty(item._id, item.cartQty - 1)}>−</button>
                        <span>{item.cartQty}</span>
                        <button onClick={() => updateCartQty(item._id, item.cartQty + 1)}>+</button>
                      </div>
                      <span className="cart-item-total">
                        ₹{item.price * item.cartQty}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  {user?.userType === "college" && (
                    <p className="points-notice">🎉 You'll earn 5 reward points!</p>
                  )}
                  <div className="cart-total">
                    <span>Total</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <button
                    className="checkout-btn"
                    onClick={() => { setShowCart(false); navigate("/orders"); }}
                  >
                    Proceed to Checkout →
                  </button>
                  <button className="clear-btn" onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}