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
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { ...product, cantidad: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, cantidad) => {
        if (cantidad < 1) return;
        setCart(prev => prev.map(item => item.id === id ? { ...item, cantidad } : item));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <CartContext.Provider value={{ 
            cart, addToCart, removeFromCart, updateQuantity, 
            cartTotal, cartCount, isCartOpen, setIsCartOpen 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);