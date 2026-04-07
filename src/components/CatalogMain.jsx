import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import CategoriesGrid from './CategoriesGrid';
import ProductsGrid from './ProductsGrid';
import { supabase as supabaseClient } from '../lib/supabase';

export default function CatalogMain() {
  const [allProducts, setAllProducts] = useState([]);
  const [categoriaActual, setCategoriaActual] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabaseClient.from("productos").select()
        if (error) {
          console.error("Error loading products:", error);
          setIsLoading(false);
          return;
        }
        setAllProducts(data);
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
        updateUI(sanitizedValue, categoriaActual);
      };
      searchInput.addEventListener('input', handleSearch);
      return () => searchInput.removeEventListener('input', handleSearch);
    }
  }, []);

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

  // Update UI elements
  const updateUI = (term, categoria) => {
    const tituloSeccion = document.getElementById('tituloSeccion');
    const resultsCount = document.getElementById('resultsCount');
    const carousel = document.getElementById('heroCarousel');
    const categoriasGrid = document.getElementById('categoriasGrid');
    const productsGrid = document.getElementById('productsGrid');

    if (!tituloSeccion || !resultsCount) return;

    const estaBuscando = term.trim() !== "";

    // Show/hide carousel
    if (carousel) {
      if (estaBuscando) {
        carousel.classList.add('hidden');
      } else if (categoria === 'Todas' || categoria === 'inicio') {
        carousel.classList.remove('hidden');
      }
    }

    // Show/hide grids
    if (categoriasGrid && productsGrid) {
      if (!estaBuscando && (categoria === 'Todas' || categoria === 'inicio')) {
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
      tituloSeccion.innerText = `Resultados para "${term}"`;
    } else if (categoria === 'SoloOfertas') {
      tituloSeccion.innerText = '🔥 Ofertas Exclusivas';
    } else if (categoria === 'Todas_Filtro' || categoria === 'Todas') {
      tituloSeccion.innerText = 'Todo el Catálogo';
    } else {
      tituloSeccion.innerText = categoria;
    }
  };

  // Handle category click
  const handleCategoryClick = (categoria) => {
    setCategoriaActual(categoria);
    setSearchTerm("");
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = "";
    }
    updateUI("", categoria);
  };

  // Update UI when dependencies change
  useEffect(() => {
    updateUI(searchTerm, categoriaActual);
  }, [searchTerm, categoriaActual]);

  // Update results count
  useEffect(() => {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.innerText = `${filtrados.length} productos`;
    }
  }, [filtrados.length]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i>
        <p className="text-lg font-bold text-gray-500">Cargando catálogo...</p>
      </div>
    );
  }

  const estaBuscando = searchTerm.trim() !== "";
  const mostrarCategorias = !estaBuscando && (categoriaActual === 'Todas' || categoriaActual === 'inicio');

  return (
    <div>
      {/* Offers section */}
      <div id="ofertasSection" className="mb-14 hidden">
        <h3 className="text-3xl font-black text-red-600 mb-6 flex items-center gap-3">
          <i className="fas fa-fire animate-pulse"></i> Ofertas Únicas
        </h3>
        <div id="ofertasGrid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"></div>
      </div>

      {/* Categories Grid */}
      {mostrarCategorias && (
        <CategoriesGrid onCategoryClick={handleCategoryClick} />
      )}

      {/* Products Grid */}
      {!mostrarCategorias && (
        <ProductsGrid 
          products={filtrados} 
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}
