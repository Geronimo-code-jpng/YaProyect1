import React, { useState, createContext, useContext, useEffect } from "react";
import PropTypes from "prop-types";

const CART_EXPIRATION = 1000 * 60 * 60;
const STORAGE_KEY = "yaCart";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.expira && Date.now() > parsed.expira) {
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        return parsed.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error cargando carrito desde localStorage:", error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const payload = {
        data: cart,
        expira: Date.now() + CART_EXPIRATION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("Error guardando carrito en localStorage:", error);
      if (error.name === 'QuotaExceededError') {
        console.warn("LocalStorage quota exceeded, clearing cart storage");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [cart]);

  const addToCart = (product) => {
    if (!product.Id) {
      console.error("Error: El producto no tiene un ID válido", product);
      return;
    }

    setCart((prev) => {
      const productId = String(product.Id);
      const productType = product.tipo || "Bulto"; // "Unidad" o "Bulto"
      
      const exists = prev.find((item) => 
        String(item.Id) === productId && (item.tipo || "Bulto") === productType
      );

      if (exists) {
        return prev.map((item) =>
          (String(item.Id) === productId && (item.tipo || "Bulto") === productType)
            ? { ...item, cantidad: item.cantidad + (product.cantidad || 1) }
            : item,
        );
      }
      return [
        ...prev,
        { 
          ...product, 
          Id: productId, 
          cantidad: product.cantidad || 1,
          tipo: productType,
          precio_unitario: product.precio_unitario || product.precio,
          quantity_per_bundle: product.quantity_per_bundle || 1,
          oferta: product.Oferta,
          descuento: product.descuento
        },
      ];
    });
  };

  const removeFromCart = (id, tipo = null) => {
    setCart((prev) => {
      if (tipo) {
        // Remove specific item with tipo
        return prev.filter((item) => 
          String(item.Id) !== String(id) || (item.tipo || "Bulto") !== tipo
        );
      } else {
        // Remove all items with this ID (both unit and bundle)
        return prev.filter((item) => String(item.Id) !== String(id));
      }
    });
  };

  const updateQuantity = (id, cantidad, tipo = null) => {
    if (cantidad < 1) return;
    setCart((prev) =>
      prev.map((item) => {
        const matchesId = String(item.Id) === String(id);
        const matchesType = !tipo || (item.tipo || "Bulto") === tipo;
        
        return matchesId && matchesType ? { ...item, cantidad } : item;
      }),
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

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
