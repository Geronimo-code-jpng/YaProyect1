const CATEGORIAS = [
  { id: "SoloOfertas", nombre: " Ofertas Exclusivas", imagen: ".ofertas.jpg" },
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

export default function CategoriesGrid({ onCategoryClick }) {
  const handleCategoryClick = (categoria) => {
    // Reset search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = "";
    }
    
    // Call parent handler
    if (onCategoryClick) {
      onCategoryClick(categoria);
    }
  };

  return (
    <div id="categoriasGrid" className="grid grid-cols-2 md:grid-cols-4 m-4 gap-4 mb-8">
      {CATEGORIAS.map((cat) => (
        <div
          key={cat.id}
          onClick={() => handleCategoryClick(cat.id)}
          className="rounded-2xl cursor-pointer transform transition hover:-translate-y-2 hover:shadow-xl flex flex-col items-center justify-center text-center h-40 relative overflow-hidden group bg-gray-200"
        >
          <img 
            src={cat.imagen} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            alt={cat.nombre} 
          />
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition"></div>
          <h3 className="relative z-10 text-white font-black text-lg md:text-xl tracking-wide leading-tight px-3 drop-shadow-lg">
            {cat.nombre}
          </h3>
        </div>
      ))}
    </div>
  );
}
