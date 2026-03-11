import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser, loginAdmin, loginVisitor, registerUser } from "../api/index";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [role,     setRole]     = useState("user");
  const [mode,     setMode]     = useState("college");
  const [isSignup, setIsSignup] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const [form, setForm] = useState({
    name:"", usn:"", email:"", phone:"", password:""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let res;

      if (role === "admin") {
        if (!form.usn || !form.password) {
          setError("Admin ID and password are required");
          setLoading(false); return;
        }
        res = await loginAdmin({ adminId: form.usn, password: form.password });
        login({ ...res.data.user, role: "admin" }, res.data.token);
        navigate("/admin"); return;
      }

      if (mode === "visitor") {
        if (!form.name || (!form.email && !form.phone)) {
          setError("Name and email or phone are required");
          setLoading(false); return;
        }
        res = await loginVisitor({ name: form.name, email: form.email, phone: form.phone });
        login({ ...res.data.user, role: "user" }, res.data.token);
        navigate("/menu"); return;
      }

      if (isSignup) {
        if (!form.name || !form.usn || !form.password) {
          setError("Name, USN and password are required");
          setLoading(false); return;
        }
        res = await registerUser({ name: form.name, usn: form.usn, email: form.email, password: form.password });
        login({ ...res.data.user, role: "user" }, res.data.token);
        navigate("/menu"); return;
      }

      if (!form.usn || !form.password) {
        setError("USN and password are required");
        setLoading(false); return;
      }
      res = await loginUser({ usn: form.usn, password: form.password });
      login({ ...res.data.user, role: "user" }, res.data.token);
      navigate("/menu");

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-icon">🍽️</div>
          <h1>Campus Canteen</h1>
          <p>Your College Food Hub 🎓</p>
        </div>

        {/* Role Dropdown */}
        <div className="form-group">
          <label>Login As</label>
          <select value={role} onChange={e => { setRole(e.target.value); setError(""); setIsSignup(false); }}>
            <option value="user">👤 User (Student / Visitor)</option>
            <option value="admin">🔑 Admin (Canteen Head)</option>
          </select>
        </div>

        {/* College / Visitor Toggle */}
        {role === "user" && !isSignup && (
          <div className="toggle-group">
            <button
              className={mode === "college" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => { setMode("college"); setError(""); }}>
              🎓 College Member
            </button>
            <button
              className={mode === "visitor" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => { setMode("visitor"); setError(""); }}>
              🚶 Visitor
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div className="form-fields">
          {isSignup && (
            <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange}/>
          )}

          {role === "user" && mode === "visitor" && (
            <>
              <input name="name"  placeholder="Your Name *"    value={form.name}  onChange={handleChange}/>
              <input name="email" placeholder="Email Address"  value={form.email} onChange={handleChange}/>
              <input name="phone" placeholder="Phone Number"   value={form.phone} onChange={handleChange}/>
            </>
          )}

          {(mode === "college" || role === "admin") && (
            <>
              <input
                name="usn"
                placeholder={role === "admin" ? "Admin ID" : "USN or Email *"}
                value={form.usn}
                onChange={handleChange}
              />
              {isSignup && (
                <input name="email" placeholder="College Email" value={form.email} onChange={handleChange}/>
              )}
              <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange}/>
            </>
          )}
        </div>

        {/* Hints */}
        {role === "admin" && (
          <p className="hint">Demo: admin / admin123</p>
        )}
        {role === "user" && mode === "college" && !isSignup && (
          <p className="hint">Demo: 1RV21CS001 / pass123</p>
        )}

        {/* Error */}
        {error && <div className="error-box">{error}</div>}

        {/* Submit */}
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." :
           role === "user" && mode === "visitor" ? "Continue as Visitor →" :
           isSignup ? "Create Account →" : "Sign In →"}
        </button>

        {/* Signup toggle */}
        {role === "user" && mode === "college" && (
          <p className="switch-link">
            {isSignup ? "Already have an account? " : "New here? "}
            <span onClick={() => { setIsSignup(!isSignup); setError(""); }}>
              {isSignup ? "Sign In" : "Create Account"}
            </span>
          </p>
        )}

      </div>
    </div>
  );
}