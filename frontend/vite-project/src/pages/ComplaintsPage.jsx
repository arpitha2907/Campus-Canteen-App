import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { raiseComplaint, getMyComplaints } from "../api/index";
import "./ComplaintsPage.css";

const categories = [
  { val: "food_quality", label: "🍽️ Food Quality" },
  { val: "delay",        label: "⏰ Delay"         },
  { val: "billing",      label: "💰 Billing"       },
  { val: "hygiene",      label: "🧹 Hygiene"       },
  { val: "other",        label: "📝 Other"         },
];

export default function ComplaintsPage() {
  const { user }   = useAuth();
  const socket     = useSocket();
  const navigate   = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const [form, setForm] = useState({
    subject: "", message: "", category: "other"
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  // real time reply notification
  useEffect(() => {
    if (!socket) return;
    socket.on("complaint_reply", ({ subject, reply }) => {
      fetchComplaints();
    });
    return () => socket.off("complaint_reply");
  }, [socket]);

  const fetchComplaints = async () => {
    try {
      const res = await getMyComplaints();
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.message) return;
    setSubmitting(true);
    try {
      await raiseComplaint(form);
      setSuccess(true);
      setForm({ subject: "", message: "", category: "other" });
      fetchComplaints();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="complaints-page">

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">🍽️</span>
          <div>
            <p className="navbar-title">Feedback</p>
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
            className={tab.key === "complaints" ? "nav-tab active" : "nav-tab"}
            onClick={() => navigate(`/${tab.key}`)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="complaints-content">

        {/* ── RAISE COMPLAINT ── */}
        <div className="complaint-form-card">
          <h2>📝 Raise a Complaint</h2>

          {success && (
            <div className="success-box">
              ✅ Complaint submitted! We'll respond soon.
            </div>
          )}

          <div className="form-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {categories.map(c => (
                <option key={c.val} value={c.val}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <input
              placeholder="Brief subject of your complaint"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              rows={4}
              placeholder="Describe your issue in detail..."
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting || !form.subject || !form.message}
          >
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>

        {/* ── MY COMPLAINTS ── */}
        <h3 className="section-title">
          My Complaints
          <span className="count-badge">{complaints.length}</span>
        </h3>

        {loading ? (
          <p className="loading-box">Loading...</p>
        ) : complaints.length === 0 ? (
          <div className="empty-box">
            <p>🎉 No complaints yet!</p>
          </div>
        ) : (
          <div className="complaints-list">
            {complaints.map(c => (
              <div key={c._id} className="complaint-card">
                <div className="complaint-header">
                  <p className="complaint-subject">{c.subject}</p>
                  <span
                    className="complaint-status"
                    style={{
                      background: c.status === "open" ? "#fef2f2" : "#f0fdf4",
                      color:      c.status === "open" ? "#ef4444" : "#16a34a"
                    }}
                  >
                    {c.status === "open"     ? "● Open"       :
                     c.status === "resolved" ? "✓ Resolved"   : "⏳ In Progress"}
                  </span>
                </div>

                <p className="complaint-time">
                  {new Date(c.createdAt).toLocaleDateString()} ·{" "}
                  <span className="complaint-cat">
                    {categories.find(x => x.val === c.category)?.label || c.category}
                  </span>
                </p>

                <p className="complaint-msg">{c.message}</p>

                {c.adminReply && (
                  <div className="admin-reply">
                    <p className="reply-label">📩 Admin Reply:</p>
                    <p className="reply-text">{c.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}