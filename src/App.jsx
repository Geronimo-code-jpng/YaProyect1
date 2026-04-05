import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import "./Global.css";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { AlertProvider } from "./contexts/AlertContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import HomePage from "./pages/HomePage";
import AdminPanel from "./components/AdminPanel";
import { useAuth } from "./contexts/AuthContext";

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [showPromoModal, setShowPromoModal] = useState(true);
  const { openAuthModal, user } = useAuth();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem("yaCart");
        if (savedCart) {
          // Cart logic will be handled by custom hook
        }

        // Simulate loading time
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FF6600] rounded-full flex items-center justify-center text-white text-3xl font-black italic mx-auto mb-4 animate-pulse">
            YA
          </div>
          <div className="text-gray-600 font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Success toast */}
        <div
          id="toastExito"
          className="fixed top-5 right-5 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl transform transition-transform translate-x-[150%] z-[99999] flex items-center gap-3 font-bold border-2 border-green-400"
        >
          <i className="fas fa-check-circle text-2xl"></i>
          <span id="toastMsg">¡Operación exitosa!</span>
        </div>

        {/* WhatsApp floating button */}
        <a
          id="floatingWa"
          href="#"
          target="_blank"
          className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-[0_10px_20px_rgba(34,197,94,0.4)] hover:bg-green-600 transition-all z-50 hover:scale-110"
        >
          <FontAwesomeIcon icon={faWhatsapp} />
        </a>

        {/* Promo modal - Solo mostrar si no hay sesión iniciada */}
        {showPromoModal && !user && (
          <div
            id="promoModal"
            className="fixed inset-0 bg-black/60 z-99999 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl modal-animate relative">
              <button
                onClick={() => setShowPromoModal(false)}
                className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-black text-3xl leading-none"
              >
                &times;
              </button>
              <i className="fas fa-gift text-6xl text-[#FF6600] mb-4"></i>
              <h2 className="text-3xl font-black text-zinc-900 leading-tight mb-2">
                ¡$1.000 OFF!
              </h2>
              <p className="text-gray-600 font-medium mb-6">
                Creá tu cuenta gratis ahora y ahorrá $1.000 en tu primera
                compra superior a $80.000.
              </p>
              <button
                onClick={() => (openAuthModal(), setShowPromoModal(false))}
                className="w-full bg-[#FF6600] text-white text-lg font-black py-4 rounded-xl hover:bg-orange-700 transition shadow-lg"
              >
                Crear Mi Cuenta
              </button>
              <button
                onClick={() => setShowPromoModal(false)}
                className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                No, gracias.
              </button>
            </div>
          </div>
        )}

        <NavBar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/producto/:id" element={<ProductDetailPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>

        <Footer />
        <CartModal />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
