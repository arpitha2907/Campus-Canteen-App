import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i =>
          i._id === item._id ? { ...i, cartQty: i.cartQty + 1 } : i
        );
      }
      return [...prev, { ...item, cartQty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i._id !== itemId));
  };

  const updateCartQty = (itemId, qty) => {
    if (qty <= 0) { removeFromCart(itemId); return; }
    setCart(prev =>
      prev.map(i => i._id === itemId ? { ...i, cartQty: qty } : i)
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.cartQty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.cartQty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart,
      updateCartQty, clearCart, cartTotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);