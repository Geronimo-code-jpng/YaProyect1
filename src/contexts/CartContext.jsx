import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('yaCart');
        return saved ? JSON.parse(saved) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('yaCart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart((prev) => {
            // Convertir id a string para asegurar comparación consistente
            const productId = String(product.id);
            const exists = prev.find(item => String(item.id) === productId);
            
            if (exists) {
                return prev.map(item => 
                    String(item.id) === productId 
                        ? { ...item, cantidad: item.cantidad + (product.cantidad || 1) } 
                        : item
                );
            }
            return [...prev, { ...product, id: productId, cantidad: product.cantidad || 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => String(item.id) !== String(id)));
    };

    const updateQuantity = (id, cantidad) => {
        if (cantidad < 1) return;
        setCart(prev => prev.map(item => String(item.id) === String(id) ? { ...item, cantidad } : item));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ 
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            cartTotal, cartCount, isCartOpen, setIsCartOpen 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);