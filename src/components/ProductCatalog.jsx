import { useState, useEffect, useMemo, useCallback } from "react";
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
          { Id: 1, nombre: "Coca-Cola 2.25L", Categoria: "BEBIDAS", precio: 1500, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Coca-Cola" },
          { Id: 2, nombre: "Papas Lays 150g", Categoria: "ALIMENTO", precio: 800, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Papas" },
          { Id: 3, nombre: "Leche La Serenísima 1L", Categoria: "LACTEOS", precio: 1200, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Leche" },
          { Id: 4, nombre: "Aceite Cocinero 900ml", Categoria: "ACEITE", precio: 2500, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Aceite" },
          { Id: 5, nombre: "Yerba Mate Taragüi 1kg", Categoria: "YERBA", precio: 3500, imagen: "https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Yerba" },
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
        // Sanitize search input to prevent XSS
        const sanitizedValue = e.target.value
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .replace(/["']/g, '') // Remove quotes
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        setSearchTerm(sanitizedValue);
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
      // Escape search term to prevent XSS in text content
      const escapedSearchTerm = searchTerm
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      tituloSeccion.textContent = `Resultados para "${escapedSearchTerm}"`;
    } else if (categoriaActual === 'SoloOfertas') {
      tituloSeccion.textContent = '🔥 Ofertas Exclusivas';
    } else if (categoriaActual === 'Todas_Filtro' || categoriaActual === 'Todas') {
      tituloSeccion.textContent = 'Todo el Catálogo';
    } else {
      tituloSeccion.textContent = categoriaActual;
    }
  }, [searchTerm, categoriaActual]);

  // Filter products
  const filtrados = useMemo(() => {
    // Sanitize and validate search term
    const term = searchTerm
      .replace(/[<>"']/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();
    const estaBuscando = term !== "";

    return allProducts.filter(p => {
      // Sanitize product name for comparison
      const productName = (p.nombre || "")
        .replace(/[<>"']/g, '')
        .toLowerCase();
      const coincideTexto = productName.includes(term);

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
  const handleCategoryClick = useCallback((categoria) => {
    setCategoriaActual(categoria);
    setSearchTerm("");
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = "";
    }
  }, [setCategoriaActual, setSearchTerm]);

  // Create product card
  const crearTarjetaProducto = useCallback((p) => {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col relative';
    
    const imgSrc = p.Imagen || p.imagen || 'https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Sin+Foto';
    const unidadVenta = p.Categoria || p.categoria || 'UNIDAD';
    const nombreSeguro = p.nombre ? p.nombre.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.-]/g, '').trim() : 'Producto';
    const precioNumero = Number(p.precio) || 0;

    // Create badge elements safely
    const ofertaBadge = p.Oferta ? (() => {
      const badge = document.createElement('div');
      badge.className = 'absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase animate-pulse';
      badge.innerHTML = '<i class="fas fa-fire"></i> OFERTA';
      return badge;
    })() : null;
    
    const tipoBadge = (() => {
      const badge = document.createElement('div');
      badge.className = 'absolute top-3 left-3 bg-yellow-400 text-black text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase';
      badge.textContent = unidadVenta;
      return badge;
    })();

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative pt-[100%] bg-white p-4';
    
    const img = document.createElement('img');
    img.src = imgSrc;
    img.className = 'absolute inset-0 w-full h-full object-contain p-5 mix-blend-multiply';
    img.alt = nombreSeguro;
    imageContainer.appendChild(img);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'p-5 flex flex-col flex-1 border-t border-gray-100 bg-gray-50/50';
    
    const title = document.createElement('h3');
    title.className = 'text-sm text-gray-800 font-bold leading-snug mb-3 line-clamp-2 h-10';
    title.textContent = nombreSeguro;
    
    const priceContainer = document.createElement('div');
    priceContainer.className = 'mt-auto';
    
    // Price display
    if (p.Oferta) {
      const ofertaText = document.createElement('p');
      ofertaText.className = 'text-xs text-red-600 font-bold mb-1';
      ofertaText.textContent = `OFERTA: -$${Number(p.Oferta).toLocaleString('es-AR')}`;
      priceContainer.appendChild(ofertaText);
    } else {
      const precioUnitario = document.createElement('span');
      precioUnitario.className = 'text-xs text-gray-500 font-semibold';
      precioUnitario.textContent = `Precio x ${unidadVenta.toLowerCase()}`;
      priceContainer.appendChild(precioUnitario);
    }
    
    const precio = document.createElement('p');
    precio.className = 'text-3xl font-black text-zinc-900 tracking-tight';
    precio.textContent = `$${precioNumero.toLocaleString('es-AR')}`;
    priceContainer.appendChild(precio);
    
    // Create button
    const button = document.createElement('button');
    button.className = 'mt-4 w-full bg-white border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white py-2.5 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm';
    button.innerHTML = '<i class="fas fa-cart-plus"></i> AGREGAR';
    
    // Add click handler to button
    button.addEventListener('click', () => {
      addToCart({
        Id: p.Id,
        nombre: nombreSeguro,
        precio: precioNumero,
        imagen: imgSrc,
        cantidad: 1
      });
      
      // Visual feedback using safe DOM manipulation
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i> AGREGADO';
      button.classList.add('bg-[#FF6600]', 'text-white');
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('bg-[#FF6600]', 'text-white');
      }, 1000);
    });
    
    priceContainer.appendChild(button);
    contentContainer.appendChild(title);
    contentContainer.appendChild(priceContainer);
    
    // Assemble card
    card.appendChild(tipoBadge);
    if (ofertaBadge) card.appendChild(ofertaBadge);
    card.appendChild(imageContainer);
    card.appendChild(contentContainer);

    return card;
  }, [addToCart]);

  // Render categories
  const renderCategories = useCallback(() => {
    const gridCat = document.getElementById('categoriasGrid');
    if (!gridCat) return;

    // Clear grid safely
    while (gridCat.firstChild) {
      gridCat.removeChild(gridCat.firstChild);
    }

    CATEGORIAS.forEach(cat => {
      const categoryCard = document.createElement('div');
      categoryCard.className = 'rounded-2xl cursor-pointer transform transition hover:-translate-y-2 hover:shadow-xl flex flex-col items-center justify-center text-center h-40 relative overflow-hidden group bg-gray-200';
      categoryCard.onclick = () => handleCategoryClick(cat.id);
      
      // Create image safely
      const img = document.createElement('img');
      img.src = cat.imagen;
      img.className = 'absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110';
      img.alt = cat.nombre;
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black/50 group-hover:bg-black/40 transition';
      
      // Create title safely
      const title = document.createElement('h3');
      title.className = 'relative z-10 text-white font-black text-lg md:text-xl tracking-wide leading-tight px-3 drop-shadow-lg';
      title.textContent = cat.nombre;
      
      categoryCard.appendChild(img);
      categoryCard.appendChild(overlay);
      categoryCard.appendChild(title);
      
      gridCat.appendChild(categoryCard);
    });
  }, [handleCategoryClick]);

  // Render products
  const renderProducts = useCallback(() => {
    const gridNormales = document.getElementById('productsGrid');
    if (!gridNormales) return;

    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = `${filtrados.length} productos`;
    }

    // Clear grid safely
    while (gridNormales.firstChild) {
      gridNormales.removeChild(gridNormales.firstChild);
    }

    if (filtrados.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'col-span-full text-center py-10 text-gray-400 font-bold';
      noResults.textContent = 'No se encontraron productos.';
      gridNormales.appendChild(noResults);
      return;
    }

    filtrados.forEach(p => {
      gridNormales.appendChild(crearTarjetaProducto(p));
    });
  }, [filtrados, crearTarjetaProducto]);

  // Update rendering based on state
  useEffect(() => {
    const estaBuscando = searchTerm.trim() !== "";
    const mostrarCategorias = !estaBuscando && (categoriaActual === 'Todas' || categoriaActual === 'inicio');

    if (mostrarCategorias) {
      renderCategories();
    } else {
      renderProducts();
    }
  }, [filtrados, categoriaActual, searchTerm, renderCategories, renderProducts]);

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
