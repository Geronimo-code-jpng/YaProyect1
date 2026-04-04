import AuthModal from "./AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import PedidosModal, { openPedidos } from "./PedidosModal";
import ProfileModal, { openProfile } from "./ProfileModal";
import { ShoppingCart, CircleUserRound, User, PackageOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar() {
  const { openAuthModal, user, userProfile, logout } = useAuth();
  const { cartCount, cartTotal, setIsCartOpen } = useCart();
  const location = useLocation();

  const toggleCart = () => {
    setIsCartOpen(true);
  };

  // Get user display name
  const getDisplayName = () => {
    if (userProfile?.nombre) {
      return userProfile.nombre.split(' ')[0]; // First name only
    }
    if (user?.email) {
      return user.email.split('@')[0]; // Username part of email
    }
    return '';
  };

  const displayName = getDisplayName();

  // Check if user is admin
  const isAdmin = userProfile?.rol === 'admin';

  return (
    <div>
      <div className="bg-white sticky top-0 z-40 shadow-sm border-b-4 border-[#FF6600]">
        {isAdmin && (
          <div className="text-center py-2 bg-red-600">
            <Link
              to="/admin"
              className="text-white hover:text-red-100 font-bold text-sm transition inline-flex items-center gap-2"
            >
              <i className="fas fa-tools"></i> Panel Admin
            </Link>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6">
            <Link
              to="/"
              className="flex items-center gap-3 cursor-pointer shrink-0 hover:opacity-80 transition"
            >
              <div className="w-14 h-14 bg-[#FF6600] rounded-xl flex items-center justify-center text-white text-4xl font-black italic shadow-md">
                YA
              </div>
              <div className="leading-none hidden sm:block">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                  MAYORISTA
                </h1>
                <span className="text-xs font-black text-[#FF6600] tracking-widest uppercase">
                  ONLINE
                </span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
              <Link
                to="/productos"
                className={`transition ${location.pathname === '/productos' ? 'text-[#FF6600]' : 'text-gray-600 hover:text-[#FF6600]'}`}
              >
                Productos
              </Link>
              <Link
                to="/categorias"
                className={`transition ${location.pathname === '/categorias' ? 'text-[#FF6600]' : 'text-gray-600 hover:text-[#FF6600]'}`}
              >
                Categorías
              </Link>
            </nav>

            <div className="w-full basis-full md:basis-auto md:flex-1 order-3 md:order-2 mt-4 md:mt-0 relative">
              <input
                type="text"
                id="searchInput"
                placeholder="Buscar productos..."
                className="w-full border-2 border-gray-200 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:border-[#FF6600] text-sm font-medium transition shadow-inner placeholder:text-transparent sm:placeholder:text-gray-400"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6600]">
                <i className="fas fa-search text-xl"></i>
              </button>
            </div>
            
            <div className="flex items-center gap-3 order-2 md:order-3 shrink-0 ml-auto md:ml-0">
              {/* Show login button when not logged in */}
              {!user ? (
                <button
                  onClick={openAuthModal}
                  id="btnIngresarMain"
                  className="flex items-center gap-2 bg-orange-100 border border-orange-200 text-[#FF6600] hover:bg-orange-200 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition"
                >
                  <CircleUserRound />
                  <span className="hidden sm:inline text-sm">
                    Ingresar
                  </span>
                </button>
              ) : (
                /* Show user info when logged in */
                <div className="flex items-center gap-3">
                  <button
                    onClick={openPedidos}
                    className="cursor-pointer flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF6600] hover:text-[#FF6600] px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
                  >
                    <PackageOpen stroke="#FF6600"/>
                    <span className="hidden sm:inline text-sm">Mis Pedidos</span>
                  </button>

                  <button
                    onClick={openProfile}
                    id="userLoggedMain"
                    className="cursor-pointer flex items-center gap-2 bg-zinc-100 border border-gray-200 text-zinc-800 hover:bg-gray-200 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
                  >
                    <User fill="#FF6600" stroke="#FF6600"/>
                    <span className="hidden sm:inline text-sm">
                      Hola, {displayName}
                    </span>
                  </button>
                </div>
              )}

              <button
                onClick={toggleCart}
                className="cursor-pointer flex items-center gap-3 bg-zinc-900 hover:bg-zinc-700 text-white px-5 py-3 rounded-full font-bold transition shadow-md hover:shadow-lg"
              >
                <div className="relative">
                  <ShoppingCart color="#FF6600" fill="#FF6600" />
                  <span
                    id="cartCountBadge"
                    className="absolute -top-3 -right-3 bg-red-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-zinc-900"
                  >
                    {cartCount}
                  </span>
                </div>
                <span
                  className="hidden sm:inline ml-1 text-lg"
                  id="cartTotalHeader"
                >
                  ${cartTotal.toLocaleString('es-AR')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <AuthModal />
        <PedidosModal />
        <ProfileModal />
      </div>
    </div>
  );
}
