import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  getDashboard, getAllOrders, getAllComplaints,
  getMenu, updateStatus, replyComplaint,
  addMenuItem, deleteMenuItem, toggleItem,
  updateQuantity, updateMenuItem
} from "../api/index";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const socket           = useSocket();
  const navigate         = useNavigate();

  const [activeTab,    setActiveTab]    = useState("orders");
  const [orders,       setOrders]       = useState([]);
  const [complaints,   setComplaints]   = useState([]);
  const [menu,         setMenu]         = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [notification, setNotification] = useState("");
  const [replies,      setReplies]      = useState({});
  const [showAddItem,  setShowAddItem]  = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [editItem,     setEditItem]     = useState({});
  const [newItem,      setNewItem]      = useState({
    name:"", description:"", price:"",
    category:"cooked", emoji:"🍽️",
    quantity:"", calories:"", isVeg: true
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_admin");
    socket.on("new_order", (order) => {
      showNotif(`🆕 New order from ${order.userName}!`);
      fetchOrders();
    });
    socket.on("new_complaint", (c) => {
      showNotif(`💬 New complaint from ${c.userName}`);
      fetchComplaints();
    });
    return () => {
      socket.off("new_order");
      socket.off("new_complaint");
    };
  }, [socket]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchComplaints(), fetchMenu(), fetchAnalytics()]);
    setLoading(false);
  };

  const fetchOrders     = async () => {
    try { const r = await getAllOrders();     setOrders(r.data.orders); }
    catch(e){ console.error(e); }
  };
  const fetchComplaints = async () => {
    try { const r = await getAllComplaints(); setComplaints(r.data.complaints); }
    catch(e){ console.error(e); }
  };
  const fetchMenu       = async () => {
    try { const r = await getMenu();          setMenu(r.data.items); }
    catch(e){ console.error(e); }
  };
  const fetchAnalytics  = async () => {
    try { const r = await getDashboard();     setAnalytics(r.data.data); }
    catch(e){ console.error(e); }
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateStatus(orderId, status);
      fetchOrders();
      showNotif(`✅ Order updated to ${status}`);
    } catch(e){ console.error(e); }
  };

  const handleReply = async (id) => {
    if (!replies[id]) return;
    try {
      await replyComplaint(id, replies[id]);
      setReplies(prev => ({ ...prev, [id]: "" }));
      fetchComplaints();
      showNotif("✅ Reply sent!");
    } catch(e){ console.error(e); }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.quantity) return;
    try {
      await addMenuItem({
        ...newItem,
        price:    parseInt(newItem.price),
        quantity: parseInt(newItem.quantity),
        calories: parseInt(newItem.calories) || 0
      });
      setShowAddItem(false);
      setNewItem({ name:"", description:"", price:"", category:"cooked", emoji:"🍽️", quantity:"", calories:"", isVeg: true });
      fetchMenu();
      showNotif("✅ Menu item added!");
    } catch(e){ console.error(e); }
  };

  const handleEditSave = async (id) => {
    try {
      await updateMenuItem(id, {
        ...editItem,
        price:    parseInt(editItem.price),
        calories: parseInt(editItem.calories) || 0,
      });
      setEditingId(null);
      fetchMenu();
      showNotif("✅ Item updated!");
    } catch(e){ console.error(e); }
  };

  const handleToggle = async (id) => {
    try { await toggleItem(id); fetchMenu(); }
    catch(e){ console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try { await deleteMenuItem(id); fetchMenu(); showNotif("🗑️ Item deleted"); }
    catch(e){ console.error(e); }
  };

  const handleQtyChange = async (id, qty) => {
    try { await updateQuantity(id, qty); fetchMenu(); }
    catch(e){ console.error(e); }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const statusColor = {
    confirmed: "#3b82f6", preparing: "#f59e0b",
    ready:     "#22c55e", completed: "#9ca3af", cancelled: "#ef4444"
  };

  const openComplaints = complaints.filter(c => c.status === "open").length;

  if (loading) return (
    <div className="admin-loading"><p>🍽️ Loading Dashboard...</p></div>
  );

  return (
    <div className="admin-page">

      {/* ── HEADER ── */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span>🍽️</span>
          <div>
            <p className="admin-title">Campus Canteen</p>
            <p className="admin-sub">Admin Dashboard</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      {/* ── NOTIFICATION ── */}
      {notification && <div className="admin-notif">{notification}</div>}

      {/* ── TABS ── */}
      <div className="admin-tabs">
        {[
          { key: "orders",     label: "📦 Orders"    },
          { key: "menu",       label: "🍽️ Menu"      },
          { key: "complaints", label: "💬 Complaints" },
          { key: "analytics",  label: "📊 Analytics" },
        ].map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === "complaints" && openComplaints > 0 && (
              <span className="notif-dot">{openComplaints}</span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-content">

        {/* ══ ORDERS ══════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div>
            <h2 className="tab-title">
              Manage Orders <span className="count-tag">{orders.length}</span>
            </h2>
            {orders.length === 0 ? (
              <div className="empty-box">No orders yet!</div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-top">
                      <div className="order-info">
                        <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                        <span className="order-user">{order.userName}</span>
                        <span className={`user-type-tag ${order.userType}`}>
                          {order.userType === "college" ? "🎓" : "🚶"} {order.userType}
                        </span>
                        <span className="status-tag" style={{ background: statusColor[order.status] + "20", color: statusColor[order.status] }}>
                          {order.status}
                        </span>
                        <span className="pay-tag">
                          {order.paymentMethod === "online" ? "💳" : "💵"} {order.paymentMethod}
                        </span>
                      </div>
                      <span className="order-amount">₹{order.totalAmount}</span>
                    </div>
                    <p className="order-items-text">
                      {order.items.map(i => `${i.name} ×${i.quantity}`).join(", ")}
                    </p>
                    <div className="status-btns">
                      {["confirmed","preparing","ready","completed","cancelled"].map(s => (
                        <button
                          key={s}
                          className={order.status === s ? "st-btn active" : "st-btn"}
                          onClick={() => handleStatusChange(order._id, s)}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MENU ════════════════════════════════════════ */}
        {activeTab === "menu" && (
          <div>
            <div className="tab-header">
              <h2 className="tab-title">
                Manage Menu <span className="count-tag">{menu.length}</span>
              </h2>
              <button className="add-item-btn" onClick={() => setShowAddItem(!showAddItem)}>
                {showAddItem ? "✕ Cancel" : "+ Add Item"}
              </button>
            </div>

            {/* add item form */}
            {showAddItem && (
              <div className="add-item-form">
                <h3>New Menu Item</h3>
                <div className="add-item-grid">
                  <input placeholder="Item name *" value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  <input placeholder="Price ₹ *" type="number" value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})} />
                  <input placeholder="Quantity *" type="number" value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
                  <input placeholder="Emoji icon" value={newItem.emoji}
                    onChange={e => setNewItem({...newItem, emoji: e.target.value})} />
                  <select value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}>
                    <option value="cooked">🔥 Cooked</option>
                    <option value="packed">📦 Packed</option>
                    <option value="healthy">🥗 Healthy</option>
                  </select>
                  <input placeholder="Calories" type="number" value={newItem.calories}
                    onChange={e => setNewItem({...newItem, calories: e.target.value})} />
                  <input className="span-2" placeholder="Description" value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})} />
                  <label className="veg-label">
                    <input type="checkbox" checked={newItem.isVeg}
                      onChange={e => setNewItem({...newItem, isVeg: e.target.checked})} />
                    🟢 Vegetarian
                  </label>
                </div>
                <button className="save-item-btn" onClick={handleAddItem}>Add to Menu</button>
              </div>
            )}

            {/* menu grid */}
            <div className="menu-grid">
              {menu.map(item => (
                <div key={item._id} className={item.isAvailable ? "menu-card" : "menu-card unavailable"}>

                  {editingId === item._id ? (
                    /* ── INLINE EDIT FORM ── */
                    <div className="edit-item-form">
                      <div className="edit-item-grid">
                        <input placeholder="Item name" value={editItem.name}
                          onChange={e => setEditItem({...editItem, name: e.target.value})} />
                        <input placeholder="Price ₹" type="number" value={editItem.price}
                          onChange={e => setEditItem({...editItem, price: e.target.value})} />
                        <input placeholder="Emoji" value={editItem.emoji}
                          onChange={e => setEditItem({...editItem, emoji: e.target.value})} />
                        <input placeholder="Calories" type="number" value={editItem.calories}
                          onChange={e => setEditItem({...editItem, calories: e.target.value})} />
                        <select value={editItem.category}
                          onChange={e => setEditItem({...editItem, category: e.target.value})}>
                          <option value="cooked">🔥 Cooked</option>
                          <option value="packed">📦 Packed</option>
                          <option value="healthy">🥗 Healthy</option>
                        </select>
                        <label className="veg-label">
                          <input type="checkbox" checked={editItem.isVeg}
                            onChange={e => setEditItem({...editItem, isVeg: e.target.checked})} />
                          🟢 Veg
                        </label>
                        <input className="edit-span-2" placeholder="Description" value={editItem.description}
                          onChange={e => setEditItem({...editItem, description: e.target.value})} />
                      </div>
                      <div className="edit-form-actions">
                        <button className="save-edit-btn" onClick={() => handleEditSave(item._id)}>Save</button>
                        <button className="cancel-edit-btn" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* ── NORMAL CARD VIEW ── */
                    <>
                      <div className="menu-card-top">
                        <span className="m-emoji">{item.emoji}</span>
                        <div className="m-info">
                          <p className="m-name">{item.name}</p>
                          <p className="m-desc">{item.description}</p>
                        </div>
                        <span className="m-price">₹{item.price}</span>
                      </div>

                      <div className="menu-card-tags">
                        <span className={`cat-tag ${item.category}`}>
                          {item.category === "cooked" ? "🔥 Cooked"
                           : item.category === "packed" ? "📦 Packed" : "🥗 Healthy"}
                        </span>
                        {item.isVeg && <span className="veg-tag">🟢 Veg</span>}
                      </div>

                      <div className="qty-row">
                        <span className="qty-label">Stock:</span>
                        <button className="qty-small-btn"
                          onClick={() => handleQtyChange(item._id, Math.max(0, item.quantity - 5))}>−</button>
                        <span className="qty-val" style={{
                          color: item.quantity === 0 ? "#ef4444" : item.quantity <= 10 ? "#f97316" : "#22c55e"
                        }}>{item.quantity}</span>
                        <button className="qty-small-btn"
                          onClick={() => handleQtyChange(item._id, item.quantity + 5)}>+</button>
                      </div>

                      <div className="menu-card-actions">
                        <button
                          className={item.isAvailable ? "toggle-btn available" : "toggle-btn unavailable"}
                          onClick={() => handleToggle(item._id)}
                        >
                          {item.isAvailable ? "✓ Available" : "✗ Disabled"}
                        </button>
                        <button className="edit-btn" onClick={() => {
                          setEditingId(item._id);
                          setEditItem({
                            name: item.name, description: item.description,
                            price: item.price, category: item.category,
                            emoji: item.emoji, calories: item.calories || "",
                            isVeg: item.isVeg
                          });
                        }}>✏️</button>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>🗑️</button>
                      </div>
                    </>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ COMPLAINTS ══════════════════════════════════ */}
        {activeTab === "complaints" && (
          <div>
            <h2 className="tab-title">
              Handle Complaints
              <span className="count-tag">{complaints.length}</span>
              {openComplaints > 0 && <span className="open-tag">{openComplaints} open</span>}
            </h2>
            {complaints.length === 0 ? (
              <div className="empty-box">🎉 No complaints!</div>
            ) : (
              <div className="complaints-list">
                {complaints.map(c => (
                  <div key={c._id} className="complaint-card">
                    <div className="complaint-top">
                      <div>
                        <p className="complaint-subject">{c.subject}</p>
                        <p className="complaint-meta">{c.userName} · {new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="complaint-status" style={{
                        background: c.status === "open" ? "#fef2f2" : "#f0fdf4",
                        color:      c.status === "open" ? "#ef4444" : "#16a34a"
                      }}>
                        {c.status === "open" ? "● Open" : "✓ Resolved"}
                      </span>
                    </div>
                    <p className="complaint-msg">{c.message}</p>
                    {c.adminReply && (
                      <div className="admin-reply"><p>📩 Your reply: {c.adminReply}</p></div>
                    )}
                    {c.status === "open" && (
                      <div className="reply-row">
                        <input
                          placeholder="Write a reply..."
                          value={replies[c._id] || ""}
                          onChange={e => setReplies(prev => ({ ...prev, [c._id]: e.target.value }))}
                        />
                        <button className="reply-btn" onClick={() => handleReply(c._id)}>Reply</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ANALYTICS ═══════════════════════════════════ */}
        {activeTab === "analytics" && analytics && (
          <div>
            <h2 className="tab-title">Analytics Dashboard</h2>

            <div className="analytics-grid">
              {[
                { label:"Total Revenue", value:`₹${analytics.overview.totalRevenue}`, icon:"💰", color:"#22c55e" },
                { label:"Total Orders",  value:analytics.overview.totalOrders,        icon:"📦", color:"#3b82f6" },
                { label:"Today Orders",  value:analytics.overview.todaysOrders,       icon:"📅", color:"#f97316" },
                { label:"Today Revenue", value:`₹${analytics.overview.todaysRevenue}`,icon:"💵", color:"#8b5cf6" },
                { label:"Students",      value:analytics.overview.totalUsers,         icon:"🎓", color:"#6366f1" },
                { label:"Open Issues",   value:analytics.complaints.open,             icon:"💬", color:"#ef4444" },
              ].map(card => (
                <div key={card.label} className="analytics-card">
                  <div className="analytics-icon" style={{ background: card.color + "20", color: card.color }}>
                    {card.icon}
                  </div>
                  <p className="analytics-value">{card.value}</p>
                  <p className="analytics-label">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="analytics-section">
              <h3>Orders by Status</h3>
              {analytics.ordersByStatus.map(s => {
                const pct = analytics.overview.totalOrders
                  ? Math.round((s.count / analytics.overview.totalOrders) * 100) : 0;
                return (
                  <div key={s._id} className="status-bar-row">
                    <span className="status-bar-label">{s._id}</span>
                    <div className="status-bar-wrap">
                      <div className="status-bar-fill" style={{ width:`${pct}%`, background: statusColor[s._id] || "#9ca3af" }} />
                    </div>
                    <span className="status-bar-count">{s.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>

            <div className="analytics-section">
              <h3>🏆 Top Selling Items</h3>
              {analytics.topItems.map((item, i) => (
                <div key={item._id} className="top-item-row">
                  <span className="top-item-rank">#{i + 1}</span>
                  <span className="top-item-name">{item._id}</span>
                  <span className="top-item-sold">{item.totalSold} sold</span>
                  <span className="top-item-rev">₹{item.revenue}</span>
                </div>
              ))}
            </div>

            <div className="analytics-section">
              <h3>📊 Category Sales</h3>
              {analytics.categoryWise.map(c => (
                <div key={c._id} className="cat-row">
                  <span className="cat-row-name">
                    {c._id === "cooked" ? "🔥 Cooked" : c._id === "packed" ? "📦 Packed" : "🥗 Healthy"}
                  </span>
                  <span className="cat-row-sold">{c.totalSold} sold</span>
                  <span className="cat-row-rev">₹{c.revenue}</span>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}