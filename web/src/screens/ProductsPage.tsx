"use client";

import React, { useState, useEffect, useRef } from "react";
import { useProducts } from "../contexts/ProductContext";
import { ProductsGrid } from "../components/catalog";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchCategorias } from "../lib/catalogApi";

export default function ProductsPage() {
  const { products, isLoading } = useProducts();

  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get("categoria");
  const searchFromUrl = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [categoriaActual, setCategoriaActual] = useState("Todas");
  const [categoriasDb, setCategoriasDb] = useState([]);

  useEffect(() => {
    fetchCategorias().then((data) => {
      const nombres = data.map((c) => c.categoria).sort();
      setCategoriasDb(nombres);
    });
  }, []);

  const normalizeCategory = (cat) => {
    const map = {
      soloofertas: "SoloOfertas",
      alimento: "ALIMENTO",
      bebidas: "BEBIDAS",
      lacteos: "LACTEOS",
      harina: "HARINA",
      aceite: "ACEITE",
      vinos: "VINOS",
      limpieza: "LIMPIEZA",
      sales: "SALES",
      cervezas: "CERVEZAS",
      yerba: "YERBA",
      aperitivos: "APERITIVOS",
      cigarrillos: "CIGARRILLOS",
    };
    return map[cat.toLowerCase()] || cat.toUpperCase();
  };

  useEffect(() => {
    setCategoriaActual(category ? normalizeCategory(category) : "Todas");
  }, [category]);

  useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  const debouncedSearch = useRef(null);
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("search", value.trim());
      else params.delete("search");
      router.replace(
        params.toString() ? `/productos?${params.toString()}` : "/productos",
      );
    }, 400);
  };
  const handleCategoryChange = (newCategory) => {
    setCategoriaActual(newCategory);

    const categoryMap = {
      SoloOfertas: "soloofertas",
      ALIMENTO: "alimento",
      BEBIDAS: "bebidas",
      LACTEOS: "lacteos",
      HARINA: "harina",
      ACEITE: "aceite",
      VINOS: "vinos",
      CERVEZAS: "cervezas",
      LIMPIEZA: "limpieza",
      SALES: "sales",
      YERBA: "yerba",
      APERITIVOS: "aperitivos",
      CIGARRILLOS: "cigarrillos",
    };

    const params = new URLSearchParams(searchParams);

    if (newCategory === "Todas" || newCategory === "Todas_Filtro") {
      params.delete("categoria");
    } else {
      const urlCategory = categoryMap[newCategory] || newCategory.toLowerCase();
      params.set("categoria", urlCategory);
    }

    router.push(
      params.toString() ? `/productos?${params.toString()}` : "/productos",
    );
  };

  // Get unique categories
  const categorias = ["Todas", "SoloOfertas", ...categoriasDb];

  const productosFiltrados = (products || []).filter((product) => {
    if (!product) return false;

    const sanitizedSearchTerm = searchFromUrl
      .replace(/[<>"']/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

    const matchesSearch =
      !sanitizedSearchTerm ||
      (product.nombre || "")
        .replace(/[<>"']/g, "")
        .toLowerCase()
        .includes(sanitizedSearchTerm);

    if (categoriaActual === "SoloOfertas") {
      return matchesSearch && product.Oferta !== null && product.Oferta !== "";
    }

    if (categoriaActual === "Todas_Filtro" || categoriaActual === "Todas") {
      return matchesSearch;
    }

    const matchesCategory = product.Categoria === categoriaActual;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Sticky Search and Filter Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-1 py-4">
          <h1 className="text-2xl md:text-4xl font-black text-zinc-900 mb-4">
            Todos los Productos
          </h1>

          {/* Search and Filter Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
              />
              <select
                value={categoriaActual}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
              >
                {categorias.map((categoria) => {
                  let displayLabel = categoria;
                  if (categoria === "SoloOfertas")
                    displayLabel = "🔥 Ofertas Exclusivas";
                  else if (categoria === "Todas_Filtro")
                    displayLabel = "Todos Los Productos";
                  else if (categoria === "Todas")
                    displayLabel = "Todas las Categorías";

                  return (
                    <option key={categoria} value={categoria}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Content */}
      <div className="container mx-auto px-1 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
            <p className="text-lg font-bold text-gray-500">
              Cargando productos...
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <i className="fas fa-search text-6xl mb-4"></i>
            <p className="text-lg font-bold">No se encontraron productos</p>
          </div>
        ) : (
          <ProductsGrid products={productosFiltrados} />
        )}
      </div>
    </div>
  );
}
