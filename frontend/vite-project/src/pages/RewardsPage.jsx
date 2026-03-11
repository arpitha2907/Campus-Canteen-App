import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/index";
import "./RewardsPage.css";

const tiers = [
  { name: "Bronze", icon: "🥉", min: 0,   max: 50,  color: "#cd7f32" },
  { name: "Silver", icon: "🥈", min: 50,  max: 150, color: "#9ca3af" },
  { name: "Gold",   icon: "🥇", min: 150, max: 9999,color: "#f59e0b" },
];

export default function RewardsPage() {
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const pts        = user?.rewardPoints || 0;
  const currentTier = tiers.find(t => pts >= t.min && pts < t.max) || tiers[0];
  const nextTier    = tiers[tiers.indexOf(currentTier) + 1];
  const progress    = nextTier
    ? ((pts - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const pointOrders = orders.filter(o => o.pointsEarned > 0);

  return (
    <div className="rewards-page">

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">🍽️</span>
          <div>
            <p className="navbar-title">Rewards</p>
            <p className="navbar-sub">{user?.name}</p>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate("/menu")}>
          ← Menu
        </button>
      </nav>

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
            className={tab.key === "rewards" ? "nav-tab active" : "nav-tab"}
            onClick={() => navigate(`/${tab.key}`)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="rewards-content">

        {/* visitor message */}
        {user?.userType === "visitor" ? (
          <div className="visitor-msg">
            <p>🏅</p>
            <p>Rewards for College Members Only</p>
            <p>Login with your college ID to earn points!</p>
          </div>
        ) : (
          <>
            {/* ── POINTS CARD ── */}
            <div className="points-card">
              <p className="points-icon">⭐</p>
              <p className="points-value">{pts}</p>
              <p className="points-label">Total Points</p>
              <p className="points-hint">Every order earns you 5 pts!</p>
            </div>

            {/* ── CURRENT TIER ── */}
            <div className="tier-card">
              <div className="tier-info">
                <span className="tier-icon">{currentTier.icon}</span>
                <div>
                  <p className="tier-name" style={{ color: currentTier.color }}>
                    {currentTier.name} Member
                  </p>
                  <p className="tier-sub">
                    {nextTier
                      ? `${nextTier.min - pts} pts to ${nextTier.name}`
                      : "You've reached the highest tier! 🎉"}
                  </p>
                </div>
              </div>

              {/* progress bar */}
              {nextTier && (
                <div className="tier-progress-wrap">
                  <div className="tier-progress-bar">
                    <div
                      className="tier-progress-fill"
                      style={{ width: `${progress}%`, background: currentTier.color }}
                    />
                  </div>
                  <div className="tier-progress-labels">
                    <span>{currentTier.min} pts</span>
                    <span>{nextTier.min} pts</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── ALL TIERS ── */}
            <h3 className="section-title">Tier Benefits</h3>
            <div className="tiers-grid">
              {tiers.map(tier => {
                const isActive = tier.name === currentTier.name;
                return (
                  <div
                    key={tier.name}
                    className="tier-item"
                    style={{ borderColor: isActive ? tier.color : "#e5e7eb" }}
                  >
                    <p className="tier-item-icon">{tier.icon}</p>
                    <p className="tier-item-name" style={{ color: tier.color }}>
                      {tier.name}
                    </p>
                    <p className="tier-item-range">
                      {tier.min}–{tier.max < 9999 ? tier.max : "∞"} pts
                    </p>
                    {isActive && (
                      <p className="tier-item-active">Current ✓</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── POINTS HISTORY ── */}
            <h3 className="section-title">Points History</h3>
            {loading ? (
              <p className="loading-box">Loading...</p>
            ) : pointOrders.length === 0 ? (
              <div className="empty-box">
                <p>Place orders to earn points! 🍽️</p>
              </div>
            ) : (
              <div className="history-list">
                {pointOrders.map(order => (
                  <div key={order._id} className="history-item">
                    <div>
                      <p className="history-id">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="history-time">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="history-pts">+{order.pointsEarned} pts</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}