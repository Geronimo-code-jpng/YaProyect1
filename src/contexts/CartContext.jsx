import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("yaCart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("yaCart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    if (!product.Id) {
      console.error("Error: El producto no tiene un ID válido", product);
      return;
    }

    setCart((prev) => {
      const productId = String(product.Id);
      const exists = prev.find((item) => String(item.Id) === productId);

      if (exists) {
        return prev.map((item) =>
          String(item.Id) === productId
            ? { ...item, cantidad: item.cantidad + (product.cantidad || 1) }
            : item,
        );
      }
      return [
        ...prev,
        { ...product, Id: productId, cantidad: product.cantidad || 1 },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => String(item.Id) !== String(id)));
  };

  const updateQuantity = (id, cantidad) => {
    if (cantidad < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        String(item.Id) === String(id) ? { ...item, cantidad } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  );

  const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  // Función para calcular total con descuento de primera compra
  const getCartTotalWithDiscount = (userProfile) => {
    const subtotal = cartTotal;
    const isFirstBuy = userProfile && (userProfile.cantidad_pedidos || 0) === 0;
    const qualifiesForDiscount = isFirstBuy && subtotal >= 80000;
    
    if (qualifiesForDiscount) {
      return Math.max(0, subtotal - 1000); // $1.000 de descuento
    }
    return subtotal;
  };

  // Función para verificar si califica para descuento
  const qualifiesForFirstBuyDiscount = (userProfile) => {
    return userProfile && (userProfile.cantidad_pedidos || 0) === 0 && cartTotal >= 80000;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        getCartTotalWithDiscount,
        qualifiesForFirstBuyDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
