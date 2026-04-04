// 1. Declare the missing global variable
let categoriaActual = "Todas";
let currentUser = null; // Assuming you also have this defined somewhere globally
let misPedidosGlobales = []; // Assuming this is also global

function filtrarCategoria(categoria) {
  categoriaActual = categoria;
  document.getElementById("searchInput").value = "";
  aplicarFiltros();
}

function aplicarFiltros() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const estaBuscando = term.trim() !== "";
  const carousel = document.getElementById("heroCarousel");

  const categoriasGrid = document.getElementById("categoriasGrid");
  const productsGrid = document.getElementById("productsGrid");
  const tituloSeccion = document.getElementById("tituloSeccion");

  if (!carousel || !categoriasGrid || !productsGrid || !tituloSeccion) return; // Safety check

  if (estaBuscando) carousel.classList.add("hidden");
  else if (categoriaActual === "Todas" || categoriaActual === "inicio")
    carousel.classList.remove("hidden");

  if (
    !estaBuscando &&
    (categoriaActual === "Todas" || categoriaActual === "inicio")
  ) {
    categoriasGrid.classList.remove("hidden");
    productsGrid.classList.add("hidden");
    tituloSeccion.innerText = "¿Qué estás buscando hoy?";
    document.getElementById("resultsCount").innerText = "Categorías";

    // renderCategoriasInicio(); // Ensure this is defined elsewhere
    return;
  }
}

function abrirAuth() {
  if (!currentUser)
    document.getElementById("authModal").classList.remove("hidden");
}

async function abrirMisPedidos() {
  // cerrarPerfil(); // Ensure this is defined elsewhere
  const modal = document.getElementById("misPedidosModal");
  const container = document.getElementById("misPedidosContainer");

  modal.classList.remove("hidden");
  container.innerHTML =
    '<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i><br><span class="font-bold text-gray-500">Buscando tus pedidos...</span></div>';

  try {
    const { data: pedidos, error } = await supabaseClient
      .from("pedidos")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("id", { ascending: false });

    if (error) throw error;

    misPedidosGlobales = pedidos;
    // renderMisPedidos(pedidos); // Ensure this is defined elsewhere
  } catch (error) {
    console.error(error);
    container.innerHTML =
      '<div class="text-center py-10 text-red-500 font-bold"><i class="fas fa-exclamation-triangle text-3xl mb-2"></i><br>PARA VER PEDIDOS INICIA SESION.</div>';
  }
}

function abrirPerfil() {
  document.getElementById("profileModal").classList.remove("hidden");
}

function toggleCart() {
  document.getElementById("cartModal").classList.toggle("hidden");
  // renderCart(); // Ensure this is defined elsewhere
}

export default function NavBar() {
  return (
    <div className="bg-white sticky top-0 z-40 shadow-sm">
      <a
        href="./admin.html"
        id="btnIrAdmin"
        className="hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
      >
        <i className="fas fa-tools"></i> Panel Admin
      </a>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6">
          {/* FIXED: Added arrow function so it doesn't execute on render */}
          <div
            onClick={() => filtrarCategoria("Todas")}
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
            {/* FIXED: Removed () so it passes the function reference */}
            <input
              type="text"
              id="searchInput"
              onKeyUp={aplicarFiltros}
              placeholder="Buscar productos..."
              className="w-full border-2 border-gray-200 rounded-sm py-3 pl-5 pr-12 focus:outline-none focus:border-[#FF6600] text-sm font-medium transition shadow-inner placeholder:text-transparent sm:placeholder:text-gray-400"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6600]">
              <i className="fas fa-search text-xl"></i>
            </button>
          </div>
          <div className="flex items-center gap-3 order-2 md:order-3 shrink-0 ml-auto md:ml-0">
            {/* FIXED: Removed () */}
            <button
              onClick={abrirAuth}
              id="btnIngresarMain"
              className="flex items-center gap-2 bg-orange-100 border border-orange-200 text-[#FF6600] hover:bg-orange-200 px-4 py-2 sm:px-5 sm:py-3 rounded-sm font-bold transition"
            >
              <i className="fas fa-user-circle text-xl"></i>{" "}
              <span className="hidden sm:inline text-sm">Ingresar /Crear Cuenta</span>
            </button>

            {/* FIXED: Removed () */}
            <button
              onClick={abrirMisPedidos}
              className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF6600] hover:text-[#FF6600] px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
            >
              <i className="fas fa-box-open text-lg"></i>
              <span className="hidden sm:inline text-sm">Mis Pedidos</span>
            </button>

            {/* FIXED: Removed () */}
            <button
              onClick={abrirPerfil}
              id="userLoggedMain"
              className="hidden items-center gap-2 bg-zinc-100 border border-gray-200 text-zinc-800 hover:bg-gray-200 px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold transition shadow-sm"
            >
              <i className="fas fa-user text-[#FF6600] text-lg"></i>
              <span
                id="userNameDisplay"
                className="hidden sm:inline text-sm"
              ></span>
            </button>

            {/* FIXED: Removed () */}
            <button
              onClick={toggleCart}
              className="flex items-center gap-3 bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-full font-bold transition shadow-md hover:shadow-lg"
            >
              <div className="relative">
                <i className="fas fa-shopping-cart text-xl text-[#FF6600]"></i>
                <span
                  id="cartCountBadge"
                  className="absolute -top-3 -right-3 bg-red-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-zinc-900"
                >
                  NaN
                </span>
              </div>
              <span
                className="hidden sm:inline ml-1 text-lg"
                id="cartTotalHeader"
              >
                $NaN
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
