import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage       from "./pages/LoginPage";
import MenuPage        from "./pages/MenuPage";
import OrdersPage      from "./pages/OrdersPage";
import RewardsPage     from "./pages/RewardsPage";
import ComplaintsPage  from "./pages/ComplaintsPage";
import AdminDashboard  from "./pages/AdminDashboard";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"#f97316", fontWeight:"bold", fontSize:"18px" }}>Loading...</p>
    </div>
  );
  return user ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"#f97316", fontWeight:"bold", fontSize:"18px" }}>Loading...</p>
    </div>
  );
  return user?.role === "admin" ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<PrivateRoute><MenuPage /></PrivateRoute>}/>
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>}/>
        <Route path="/rewards" element={<PrivateRoute><RewardsPage /></PrivateRoute>}/>
        <Route path="/complaints" element={<PrivateRoute><ComplaintsPage /></PrivateRoute>}/>
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}/>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}