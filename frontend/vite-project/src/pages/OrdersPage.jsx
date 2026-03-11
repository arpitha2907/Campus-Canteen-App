import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSocket } from "../context/SocketContext";
import { placeOrder, getMyOrders } from "../api/index";
import "./OrdersPage.css";

const statusSteps = ["confirmed", "preparing", "ready", "completed"];

const statusInfo = {
  confirmed: { icon: "✅", label: "Confirmed",        color: "#3b82f6" },
  preparing: { icon: "👨‍🍳", label: "Being Prepared",  color: "#f59e0b" },
  ready:     { icon: "🔔", label: "Ready for Pickup", color: "#22c55e" },
  completed: { icon: "🎉", label: "Completed",         color: "#9ca3af" },
  cancelled: { icon: "❌", label: "Cancelled",         color: "#ef4444" },
};

export default function OrdersPage() {
  const { user }                       = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const socket                         = useSocket();
  const navigate                       = useNavigate();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [placing,      setPlacing]      = useState(false);
  const [payMethod,    setPayMethod]    = useState("cash"); // ← fixed default
  const [upiId,        setUpiId]        = useState("");    // ← moved inside component
  const [successMsg,   setSuccessMsg]   = useState("");
  const [activeTab,    setActiveTab]    = useState("orders");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  // ── real time socket events ──────────────────────────
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("join_room", user.id);

    socket.on("order_confirmed", () => {
      showNotification("✅ Order confirmed!");
      fetchOrders();
    });

    socket.on("order_status_update", ({ orderId, status, message }) => {
      showNotification(message);
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status } : o)
      );
      if (status === "ready" && Notification.permission === "granted") {
        new Notification("Campus Canteen 🍽️", {
          body: "Your order is ready for pickup!"
        });
      }
    });

    return () => {
      socket.off("order_confirmed");
      socket.off("order_status_update");
    };
  }, [socket, user]);

  const fetchOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const handlePlaceOrder = async () => {
    if (!cart.length) return;

    if (payMethod === "upi" && !upiId) {
      showNotification("❌ Please enter your UPI ID");
      return;
    }

    setPlacing(true);
    try {
      const items = cart.map(i => ({
        menuItemId: i._id,
        quantity:   i.cartQty
      }));

      const pointsDiscount = payMethod === "points"
        ? Math.floor((user?.rewardPoints || 0) / 10)
        : 0;
      const finalAmount = Math.max(0, cartTotal - pointsDiscount);

      await placeOrder({
        items,
        paymentMethod: payMethod,
        upiId:         payMethod === "upi" ? upiId : "",
        finalAmount
      });

      clearCart();
      setUpiId("");

      const msg =
        payMethod === "cash"   ? "🎉 Order placed! Pay at counter."      :
        payMethod === "upi"    ? "🎉 Order placed! Complete UPI payment." :
                                 "🎉 Order placed! Points redeemed.";

      setSuccessMsg(msg);
      fetchOrders();
      setTimeout(() => setSuccessMsg(""), 5000);

      // request browser notification permission
      if ("Notification" in window) Notification.requestPermission();

    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const getStatusIndex = (status) => statusSteps.indexOf(status);

  return (
    <div className="orders-page">

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">🍽️</span>
          <div>
            <p className="navbar-title">My Orders</p>
            <p className="navbar-sub">{user?.name}</p>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate("/menu")}>
          ← Menu
        </button>
      </nav>

      {/* ── LIVE NOTIFICATION ── */}
      {notification && (
        <div className="live-notification">{notification}</div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        {[
          { key: "menu",       icon: "🍽️", label: "Menu"     },
          { key: "orders",     icon: "📦", label: "Orders"   },
          { key: "rewards",    icon: "⭐", label: "Rewards"  },
          { key: "complaints", icon: "💬", label: "Feedback" },
        ].map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "nav-tab active" : "nav-tab"}
            onClick={() => { setActiveTab(tab.key); navigate(`/${tab.key}`); }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="orders-content">

        {/* ── CHECKOUT SECTION ── */}
        {cart.length > 0 && (
          <div className="checkout-card">
            <h2>🛒 Checkout</h2>

            {successMsg && (
              <div className="success-box">{successMsg}</div>
            )}

            {/* cart items */}
            <div className="checkout-items">
              {cart.map(item => (
                <div key={item._id} className="checkout-item">
                  <span className="co-emoji">{item.emoji}</span>
                  <span className="co-name">{item.name}</span>
                  <span className="co-qty">×{item.cartQty}</span>
                  <span className="co-price">₹{item.price * item.cartQty}</span>
                </div>
              ))}
            </div>

            <div className="checkout-divider"/>

            {/* payment method */}
            <div className="pay-section">
              <p className="pay-label">Payment Method</p>
              <div className="pay-options">
                <button
                  className={payMethod === "cash" ? "pay-btn active" : "pay-btn"}
                  onClick={() => setPayMethod("cash")}
                >
                  💵 Pay by Cash
                </button>
                <button
                  className={payMethod === "upi" ? "pay-btn active" : "pay-btn"}
                  onClick={() => setPayMethod("upi")}
                >
                  📱 Pay by UPI
                </button>
                {user?.userType === "college" && user?.rewardPoints >= 20 && (
                  <button
                    className={payMethod === "points" ? "pay-btn active" : "pay-btn"}
                    onClick={() => setPayMethod("points")}
                  >
                    ⭐ Use Points ({user?.rewardPoints} pts)
                  </button>
                )}
              </div>

              {/* UPI input */}
              {payMethod === "upi" && (
                <div className="upi-input-wrap">
                  <input
                    placeholder="Enter UPI ID (e.g. name@upi)"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                  />
                  <p className="upi-hint">
                    💡 Pay to canteen UPI: <strong>canteen@upi</strong>
                  </p>
                </div>
              )}

              {/* points info */}
              {payMethod === "points" && (
                <div className="points-info-box">
                  <p>⭐ You have <strong>{user?.rewardPoints} points</strong></p>
                  <p>Each 10 points = ₹1 discount</p>
                  <p className="points-discount">
                    Discount: ₹{Math.floor(user?.rewardPoints / 10)}
                  </p>
                  <p className="points-final">
                    Final: ₹{Math.max(0, cartTotal - Math.floor(user?.rewardPoints / 10))}
                  </p>
                </div>
              )}
            </div>

            {/* total */}
            <div className="checkout-total">
              <span>Total Amount</span>
              <span>
                {payMethod === "points"
                  ? `₹${Math.max(0, cartTotal - Math.floor((user?.rewardPoints || 0) / 10))}`
                  : `₹${cartTotal}`}
              </span>
            </div>

            {payMethod === "points" && (
              <div className="discount-row">
                <span>Points Discount</span>
                <span>- ₹{Math.floor((user?.rewardPoints || 0) / 10)}</span>
              </div>
            )}

            {user?.userType === "college" && payMethod !== "points" && (
              <p className="earn-notice">🎉 You'll earn 5 reward points!</p>
            )}

            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing          ? "Placing Order..."  :
               payMethod === "cash"   ? `Place Order · Pay ₹${cartTotal} at counter` :
               payMethod === "upi"    ? `Place Order · Pay ₹${cartTotal} via UPI`    :
               `Place Order · ₹${Math.max(0, cartTotal - Math.floor((user?.rewardPoints || 0) / 10))} with Points`}
            </button>
          </div> 
        )}

        {/* ── MY ORDERS ── */}
        <h2 className="section-title">
          My Orders
          <span className="order-count">{orders.length}</span>
        </h2>

        {loading ? (
          <div className="loading-box">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-box">
            <p>😋</p>
            <p>No orders yet!</p>
            <button className="browse-btn" onClick={() => navigate("/menu")}>
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const info  = statusInfo[order.status] || statusInfo.confirmed;
              const stepI = getStatusIndex(order.status);
              return (
                <div key={order._id} className="order-card">

                  <div className="order-header">
                    <div className="order-id">
                      <span>#{order._id.slice(-6).toUpperCase()}</span>
                      <span
                        className="status-badge"
                        style={{ background: info.color + "20", color: info.color }}
                      >
                        {info.icon} {info.label}
                      </span>
                    </div>
                    <span className="order-time">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>

                  {/* progress bar */}
                  {order.status !== "cancelled" && (
                    <div className="progress-bar">
                      {statusSteps.map((step, i) => (
                        <div key={step} className="progress-step">
                          <div
                            className="progress-dot"
                            style={{
                              background: i <= stepI ? "#f97316" : "#e5e7eb",
                              transform:  i === stepI ? "scale(1.3)" : "scale(1)"
                            }}
                          />
                          {i < statusSteps.length - 1 && (
                            <div
                              className="progress-line"
                              style={{ background: i < stepI ? "#f97316" : "#e5e7eb" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* progress labels */}
                  {order.status !== "cancelled" && (
                    <div className="progress-labels">
                      {statusSteps.map((step, i) => (
                        <span
                          key={step}
                          style={{ color: i <= stepI ? "#f97316" : "#9ca3af" }}
                        >
                          {step.charAt(0).toUpperCase() + step.slice(1)}
                        </span>
                      ))}
                    </div>
                  )}

                  {order.status === "ready" && (
                    <div className="ready-alert">
                      🔔 Your order is ready! Please collect from the counter.
                    </div>
                  )}

                  <p className="order-items">
                    {order.items.map(i => `${i.name} ×${i.quantity}`).join(", ")}
                  </p>

                  <div className="order-footer">
                    <span className="order-total">₹{order.totalAmount}</span>
                    <div className="order-meta">
                      {order.pointsEarned > 0 && (
                        <span className="pts-tag">+{order.pointsEarned} pts</span>
                      )}
                      <span className="pay-tag">
                        {order.paymentMethod === "upi"    ? "📱 UPI"    :
                         order.paymentMethod === "points" ? "⭐ Points" : "💵 Cash"}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>  {/* ← orders-content closes here */}
    </div>    // ← orders-page closes here
  );
}
