import React, { useState, useMemo } from "react";

// 1. Definimos los tipos de datos (TypeScript)
interface Producto {
  id: number;
  nombre: string;
  Categoria: string;
  Oferta: string | null;
  precio: number;
  // ... agregá acá las demás propiedades de tus productos
}

interface CardCatalogoProps {
  allProducts: Producto[];
  searchTerm: string; // Recibimos lo que el usuario escribe en la lupa desde el Header
}

// 2. Sacamos la lista de tarjetas afuera para que el código quede súper limpio
const CATEGORIAS = [
  {
    id: "SoloOfertas",
    nombre: "Ofertas Exclusivas",
    imagen: "./carpetafotos/ofertas.jpg",
  },
  {
    id: "Todas_Filtro",
    nombre: "Todos Los Productos",
    imagen: "./carpetafotos/todocatalogo.jpg",
  },
  {
    id: "ALIMENTO",
    nombre: "Alimentos",
    imagen: "./carpetafotos/alimentos.jpg",
  },
  { id: "BEBIDAS", nombre: "Bebidas", imagen: "./carpetafotos/bebidas.jpg" },
  { id: "LACTEOS", nombre: "Lácteos", imagen: "./carpetafotos/lacteos.jpg" },
  { id: "HARINA", nombre: "Harinas", imagen: "./carpetafotos/harinas.jpg" },
  { id: "ACEITE", nombre: "Aceites", imagen: "./carpetafotos/aceites.jpg" },
  { id: "VINOS", nombre: "Vinos", imagen: "./carpetafotos/vinos.jpg" },
  { id: "CERVEZAS", nombre: "Cervezas", imagen: "./carpetafotos/cervezas.jpg" },
  { id: "YERBA", nombre: "Yerbas", imagen: "./carpetafotos/yerbas.jpg" },
  {
    id: "APERITIVOS",
    nombre: "Aperitivos",
    imagen: "./carpetafotos/aperitivos.jpg",
  },
];

// Reemplazá desde tu "export default function..." hasta el "const filtrados = useMemo..." con esto:

export default function CardCatalogo({
  allProducts,
  searchTerm,
}: CardCatalogoProps) {
  const [categoriaActual, setCategoriaActual] = useState<string>("Todas");

  const filtrados = useMemo(() => {
    // PARACAÍDAS: (searchTerm || '') asegura que nunca sea undefined
    const term = (searchTerm || "").toLowerCase().trim();
    const estaBuscando = term !== "";
    return (allProducts || []).filter((p) => {
      const coincideTexto = (p.nombre || "").toLowerCase().includes(term);

      if (estaBuscando) return coincideTexto;
      if (categoriaActual === "SoloOfertas")
        return coincideTexto && p.Oferta !== null && p.Oferta !== "";
      if (categoriaActual === "Todas_Filtro" || categoriaActual === "Todas")
        return coincideTexto;

      // PARACAÍDAS EXTRA: Verificamos que p.Categoria exista antes de hacerle toLowerCase
      const coincideCat =
        p.Categoria &&
        p.Categoria.toLowerCase() === categoriaActual.toLowerCase();
      return coincideTexto && coincideCat;
    });
  }, [allProducts, searchTerm, categoriaActual]);

  // 5. Variables para saber qué mostrar en pantalla
  const estaBuscando = searchTerm.trim() !== "";
  const mostrarCategorias =
    !estaBuscando &&
    (categoriaActual === "Todas" || categoriaActual === "inicio");

  // 6. Textos dinámicos
  let tituloSeccion = "¿Qué estás buscando hoy?";
  if (estaBuscando) tituloSeccion = `Resultados para "${searchTerm}"`;
  else if (categoriaActual === "SoloOfertas")
    tituloSeccion = "🔥 Ofertas Exclusivas";
  else if (categoriaActual === "Todas_Filtro" || categoriaActual === "Todas")
    tituloSeccion = "";
  else tituloSeccion = categoriaActual;

  return (
    <div id="statusMessage" className="text-center py-4 text-xl font-bold text-gray-400">
    <div id="catalogoSection">
      {/* Título y Contador dinámicos */}
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-black text-zinc-800 tracking-tight mt-2">
          {tituloSeccion}
        </h2>
      </div>

      {/* CONDICIONAL: Si estamos en inicio, mostramos la grilla de fotos */}
      {mostrarCategorias ? (
        <div
          id="categoriasGrid"
          className="grid grid-cols-2 md:grid-cols-4 m-4 gap-4 mb-8"
        >
          {CATEGORIAS.map((cat) => (
            <div
              key={cat.id}
              onClick={() => { setCategoriaActual(cat.id); }} // <- Así se hace el click en React
              className="rounded-2xl cursor-pointer transform transition hover:-translate-y-2 hover:shadow-xl flex flex-col items-center justify-center text-center h-40 relative overflow-hidden group bg-gray-200"
            >
              <img
                src={cat.imagen}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt={cat.nombre}
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition" />
              <h3 className="relative z-10 text-white font-black text-lg md:text-xl tracking-wide leading-tight px-3 drop-shadow-lg">
                {cat.nombre}
              </h3>
            </div>
          ))}
        </div>
      ) : (
        /* CONDICIONAL: Si no estamos en inicio, mostramos los productos */
        <div
          id="productsGrid"
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {filtrados.length > 0 ? (
            filtrados.map((producto) => (
              <div
                key={producto.id}
                className="p-4 bg-white rounded-xl shadow border"
              >
                {/* ACÁ ADENTRO VA TU COMPONENTE DE PRODUCTO */}
                <p className="font-bold">{producto.nombre}</p>
                <p className="text-[#FF6600]">${producto.precio}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500 font-bold">
              No se encontraron productos.
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
