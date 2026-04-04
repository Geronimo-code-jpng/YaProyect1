import AuthModal from "./AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, CircleUserRound } from "lucide-react";

export default function NavBar() {
  const { openAuthModal, user, userProfile, logout } = useAuth();
  const { cartCount, cartTotal, setIsCartOpen } = useCart();

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

  return (
    <div>
      <div className="bg-white sticky top-0 z-40 shadow-sm border-b-4 border-[#FF6600]">
        <a
          href="./admin.html"
          id="btnIrAdmin"
          className="hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
        >
          <i className="fas fa-tools"></i> Panel Admin
        </a>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6">
            <div
              onClick={() => {
                // Reset to home view
                const searchInput = document.getElementById("searchInput");
                if (searchInput) searchInput.value = "";
                window.location.reload(); // Simple reset for now
              }}
              className="flex items-center gap-3 cursor-pointer shrink-0"
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
            </div>

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
                    onClick={() => alert("Mis Pedidos próximamente")}
                    className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF6600] hover:text-[#FF6600] px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
                  >
                    <i className="fas fa-box-open text-lg"></i>
                    <span className="hidden sm:inline text-sm">Mis Pedidos</span>
                  </button>

                  <button
                    onClick={() => alert("Perfil próximamente")}
                    id="userLoggedMain"
                    className="flex items-center gap-2 bg-zinc-100 border border-gray-200 text-zinc-800 hover:bg-gray-200 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
                  >
                    <i className="fas fa-user text-[#FF6600] text-lg"></i>
                    <span className="hidden sm:inline text-sm">
                      Hola, {displayName}
                    </span>
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
                  >
                    <i className="fas fa-sign-out-alt text-lg"></i>
                    <span className="hidden sm:inline text-sm">
                      Salir
                    </span>
                  </button>
                </div>
              )}

              <button
                onClick={toggleCart}
                className="flex items-center gap-3 bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-full font-bold transition shadow-md hover:shadow-lg"
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
      </div>
    </div>
  );
}
