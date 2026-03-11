import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider }   from "./context/AuthContext";
import { CartProvider }   from "./context/CartContext";
import { SocketProvider } from "./context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CartProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </CartProvider>
  </AuthProvider>
);