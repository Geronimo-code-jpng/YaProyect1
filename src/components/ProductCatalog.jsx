import { useState, useEffect, useMemo } from "react";
import { useCart } from "../contexts/CartContext";

// Categories data
const CATEGORIAS = [
  { id: "SoloOfertas", nombre: " Ofertas Exclusivas", imagen: "./carpetafotos/ofertas.jpg" },
  { id: "Todas_Filtro", nombre: " Todos Los Productos", imagen: "./carpetafotos/todocatalogo.jpg" },
  { id: "ALIMENTO", nombre: " Alimentos", imagen: "./carpetafotos/alimentos.jpg" },
  { id: "BEBIDAS", nombre: " Bebidas", imagen: "./carpetafotos/bebidas.jpg" },
  { id: "LACTEOS", nombre: " Lácteos", imagen: "./carpetafotos/lacteos.jpg" },
  { id: "HARINA", nombre: " Harinas", imagen: "./carpetafotos/harinas.jpg" },
  { id: "ACEITE", nombre: " Aceites", imagen: "./carpetafotos/aceites.jpg" },
  { id: "VINOS", nombre: " Vinos", imagen: "./carpetafotos/vinos.jpg" },
  { id: "CERVEZAS", nombre: " Cervezas", imagen: "./carpetafotos/cervezas.jpg" },
  { id: "YERBA", nombre: " Yerbas", imagen: "./carpetafotos/yerbas.jpg" },
  { id: "APERITIVOS", nombre: " Aperitivos", imagen: "./carpetafotos/aperitivos.jpg" }
];

export default function ProductCatalog() {
  const [allProducts, setAllProducts] = useState([]);
  const [categoriaActual, setCategoriaActual] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // This would be replaced with actual Supabase call
        // For now, using mock data
        const mockProducts = [
          { id: 1, nombre: "Coca-Cola 2.25L", Categoria: "BEBIDAS", precio: 1500, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Coca-Cola" },
          { id: 2, nombre: "Papas Lays 150g", Categoria: "ALIMENTO", precio: 800, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Papas" },
          { id: 3, nombre: "Leche La Serenísima 1L", Categoria: "LACTEOS", precio: 1200, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Leche" },
          { id: 4, nombre: "Aceite Cocinero 900ml", Categoria: "ACEITE", precio: 2500, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Aceite" },
          { id: 5, nombre: "Yerba Mate Taragüi 1kg", Categoria: "YERBA", precio: 3500, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Yerba" },
        ];
        setAllProducts(mockProducts);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading products:", error);
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Handle search input
  useEffect(() => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const handleSearch = (e) => {
        setSearchTerm(e.target.value);
      };
      searchInput.addEventListener('input', handleSearch);
      return () => searchInput.removeEventListener('input', handleSearch);
    }
  }, []);

  // Update UI elements
  useEffect(() => {
    const tituloSeccion = document.getElementById('tituloSeccion');
    const resultsCount = document.getElementById('resultsCount');
    const carousel = document.getElementById('heroCarousel');
    const categoriasGrid = document.getElementById('categoriasGrid');
    const productsGrid = document.getElementById('productsGrid');

    if (!tituloSeccion || !resultsCount) return;

    const estaBuscando = searchTerm.trim() !== "";

    // Show/hide carousel
    if (carousel) {
      if (estaBuscando) {
        carousel.classList.add('hidden');
      } else if (categoriaActual === 'Todas' || categoriaActual === 'inicio') {
        carousel.classList.remove('hidden');
      }
    }

    // Show/hide grids
    if (categoriasGrid && productsGrid) {
      if (!estaBuscando && (categoriaActual === 'Todas' || categoriaActual === 'inicio')) {
        categoriasGrid.classList.remove('hidden');
        productsGrid.classList.add('hidden');
        tituloSeccion.innerText = '¿Qué estás buscando hoy?';
        resultsCount.innerText = 'Categorías';
      } else {
        categoriasGrid.classList.add('hidden');
        productsGrid.classList.remove('hidden');
      }
    }

    // Update title
    if (estaBuscando) {
      tituloSeccion.innerText = `Resultados para "${searchTerm}"`;
    } else if (categoriaActual === 'SoloOfertas') {
      tituloSeccion.innerText = '🔥 Ofertas Exclusivas';
    } else if (categoriaActual === 'Todas_Filtro' || categoriaActual === 'Todas') {
      tituloSeccion.innerText = 'Todo el Catálogo';
    } else {
      tituloSeccion.innerText = categoriaActual;
    }
  }, [searchTerm, categoriaActual]);

  // Filter products
  const filtrados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const estaBuscando = term !== "";

    return allProducts.filter(p => {
      const coincideTexto = (p.nombre || "").toLowerCase().includes(term);

      if (estaBuscando) return coincideTexto;

      if (categoriaActual === 'SoloOfertas') {
        return coincideTexto && (p.Oferta !== null && p.Oferta !== "");
      }

      if (categoriaActual === 'Todas_Filtro' || categoriaActual === 'Todas') {
        return coincideTexto;
      }

      const categoria = p.Categoria || p.categoria;
      const coincideCat = categoria && categoria.toLowerCase() === categoriaActual.toLowerCase();
      return coincideTexto && coincideCat;
    });
  }, [allProducts, searchTerm, categoriaActual]);

  // Handle category click
  const handleCategoryClick = (categoria) => {
    setCategoriaActual(categoria);
    setSearchTerm("");
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = "";
    }
  };

  // Create product card
  const crearTarjetaProducto = (p) => {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col relative';
    
    const imgSrc = p.Imagen || p.imagen || 'https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Sin+Foto';
    const unidadVenta = p.Categoria || p.categoria || 'UNIDAD';
    const nombreSeguro = p.nombre ? p.nombre.replace(/"/g, '&quot;').replace(/'/g, '&#39;').trim() : 'Producto';
    const precioNumero = Number(p.precio) || 0;

    const ofertaBadge = p.Oferta ? `<div class="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase animate-pulse"><i class="fas fa-fire"></i> OFERTA</div>` : '';
    const tipoBadge = `<div class="absolute top-3 left-3 bg-yellow-400 text-black text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase">${unidadVenta}</div>`;

    let precioTextHtml = p.Oferta
      ? `<p class="text-xs text-red-600 font-bold mb-1">OFERTA: -$${Number(p.Oferta).toLocaleString('es-AR')}</p>`
      : `<span class="text-xs text-gray-500 font-semibold">Precio x ${unidadVenta.toLowerCase()}</span>`;

    card.innerHTML = `
      ${tipoBadge} ${ofertaBadge}
      <div class="relative pt-[100%] bg-white p-4">
        <img src="${imgSrc}" class="absolute inset-0 w-full h-full object-contain p-5 mix-blend-multiply" alt="${nombreSeguro}">
      </div>
      <div class="p-5 flex flex-col flex-1 border-t border-gray-100 bg-gray-50/50">
        <h3 class="text-sm text-gray-800 font-bold leading-snug mb-3 line-clamp-2 h-10">${nombreSeguro}</h3>
        <div class="mt-auto">
          ${precioTextHtml}
          <p class="text-3xl font-black text-zinc-900 tracking-tight">$${precioNumero.toLocaleString('es-AR')}</p>
          <button data-nombre="${nombreSeguro}" data-precio="${precioNumero}" data-imagen="${imgSrc}" 
                  class="mt-4 w-full bg-white border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white py-2.5 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm">
            <i class="fas fa-cart-plus"></i> AGREGAR
          </button>
        </div>
      </div>
    `;

    // Add click handler to button
    const button = card.querySelector('button');
    if (button) {
      button.addEventListener('click', () => {
        addToCart({
          id: p.id,
          nombre: nombreSeguro,
          precio: precioNumero,
          imagen: imgSrc,
          cantidad: 1
        });
        
        // Visual feedback
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> AGREGADO';
        button.classList.add('bg-[#FF6600]', 'text-white');
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('bg-[#FF6600]', 'text-white');
        }, 1000);
      });
    }

    return card;
  };

  // Render categories
  const renderCategories = () => {
    const gridCat = document.getElementById('categoriasGrid');
    if (!gridCat) return;

    gridCat.innerHTML = '';
    CATEGORIAS.forEach(cat => {
      const categoryCard = document.createElement('div');
      categoryCard.className = 'rounded-2xl cursor-pointer transform transition hover:-translate-y-2 hover:shadow-xl flex flex-col items-center justify-center text-center h-40 relative overflow-hidden group bg-gray-200';
      categoryCard.onclick = () => handleCategoryClick(cat.id);
      
      categoryCard.innerHTML = `
        <img src="${cat.imagen}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${cat.nombre}">
        <div class="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition"></div>
        <h3 class="relative z-10 text-white font-black text-lg md:text-xl tracking-wide leading-tight px-3 drop-shadow-lg">${cat.nombre}</h3>
      `;
      
      gridCat.appendChild(categoryCard);
    });
  };

  // Render products
  const renderProducts = () => {
    const gridNormales = document.getElementById('productsGrid');
    if (!gridNormales) return;

    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.innerText = `${filtrados.length} productos`;
    }

    gridNormales.innerHTML = '';

    if (filtrados.length === 0) {
      gridNormales.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400 font-bold">No se encontraron productos.</div>`;
      return;
    }

    filtrados.forEach(p => {
      gridNormales.appendChild(crearTarjetaProducto(p));
    });
  };

  // Update rendering based on state
  useEffect(() => {
    const estaBuscando = searchTerm.trim() !== "";
    const mostrarCategorias = !estaBuscando && (categoriaActual === 'Todas' || categoriaActual === 'inicio');

    if (mostrarCategorias) {
      renderCategories();
    } else {
      renderProducts();
    }
  }, [filtrados, categoriaActual, searchTerm]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i>
        <p className="text-lg font-bold text-gray-500">Cargando catálogo...</p>
      </div>
    );
  }

  return null; // This component manipulates the DOM directly
}
