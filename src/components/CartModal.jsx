import React from "react";
import { useCart } from "../context/CartContext";

export default function CartModal() {
  const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const changeQty = (index, delta) => {
    const item = cart[index];
    const newCantidad = Math.max(1, item.cantidad + delta);
    updateQuantity(item.id, newCantidad);
  };

  const setQty = (index, valorIngresado) => {
    let nuevaCantidad = parseInt(valorIngresado);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    const item = cart[index];
    updateQuantity(item.id, nuevaCantidad);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-9000 flex justify-end transition-opacity">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <i className="fas fa-shopping-cart text-[#FF6600]"></i> Mi Pedido
          </h3>
          <button onClick={toggleCart} className="text-4xl text-gray-400 hover:text-red-500 leading-none">
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 bg-white">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <i className="fas fa-shopping-basket text-6xl mb-4 text-gray-300"></i>
              <p className="text-lg font-bold">Tu carrito está vacío</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.id} className="flex gap-4 mb-5 pb-5 border-b relative">
                <img 
                  src={item.imagen} 
                  className="w-20 h-20 object-contain rounded-xl border p-1 bg-white" 
                  alt={item.nombre}
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm pr-6">{item.nombre}</h4>
                  <div className="font-black text-[#FF6600]">
                    ${item.precio.toLocaleString('es-AR')}
                  </div>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden mt-2 w-max relative">
                    <button 
                      onClick={() => changeQty(index, -1)}
                      className="w-8 h-8 font-bold bg-gray-50 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.cantidad} 
                      onChange={(e) => setQty(index, e.target.value)}
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      className="w-12 h-8 text-center font-black focus:outline-none focus:bg-blue-50 text-gray-700"
                      style={{MozAppearance: 'textfield'}}
                    />
                    <button 
                      onClick={() => changeQty(index, 1)}
                      className="w-8 h-8 font-bold bg-gray-50 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-0 right-0 text-gray-300 hover:text-red-500 p-1"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between text-2xl font-black mb-4">
            <span>Subtotal:</span>
            <span className="text-[#FF6600]">${cartTotal.toLocaleString('es-AR')}</span>
          </div>
          <button 
            className="w-full py-4 bg-[#FF6600] hover:bg-orange-700 text-white text-lg font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            onClick={() => {
              // This would open checkout modal
              alert("Función de checkout próximamente");
            }}
          >
            Completar Compra <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
