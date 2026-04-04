import React, { useState } from 'react';

// 1. Definimos los datos fuera del componente para que no se recreen en cada render
const sucursalesData = {
    santafe: { nombre: "Santa Fe Central", direccion: "Pedro de Vega 3220", whatsapp: "543425084197" },
    santotome: { nombre: "Santo Tomé", direccion: "Pje. San Luis 2535", whatsapp: "543425967418" }
};

// Creamos un tipo para que TypeScript nos ayude con el autocompletado
type SucursalKey = keyof typeof sucursalesData;

export default function QEB() {
    // 2. Usamos useState para guardar la sucursal actual y la opacidad de la animación
    const [sucursal, setSucursal] = useState<SucursalKey>('santafe');
    const [opacity, setOpacity] = useState(1);

    // 3. La función manejadora del cambio
    const cambiarSucursal = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevaSucursal = e.target.value as SucursalKey;
        
        // Efecto de desvanecimiento
        setOpacity(0);
        
        setTimeout(() => {
            // Actualizamos el estado con la nueva sucursal (React cambia el texto solo)
            setSucursal(nuevaSucursal);
            // Volvemos a mostrar el texto
            setOpacity(1);
        }, 150);

        // Opcional: Si el botón de WhatsApp sigue estando fuera de React en tu index.html
        // podés mantener esta línea. Si ya lo pasaste a React, deberías usar otro estado o contexto.
        const waBtn = document.getElementById('floatingWa') as HTMLAnchorElement;
        if (waBtn) {
            waBtn.href = `https://wa.me/${sucursalesData[nuevaSucursal].whatsapp}`;
        }
    };

    // Obtenemos los datos de la sucursal activa
    const datosActivos = sucursalesData[sucursal];

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm">
                
                {/* Agrupé el título y el contador en un div para que no se desarmen con el flex */}
                <div>
                    <span className="text-sm font-black text-[#FF6600] bg-orange-100 px-4 py-1.5 rounded-full uppercase" id="resultsCount">Categorías</span>
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-800 tracking-tight mt-2" id="tituloSeccion">¿Qué estás buscando hoy?</h2>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-2.5 rounded-xl min-w-[280px] hover:border-orange-300 transition">
                    <div className="bg-[#FF6600] text-white w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm">
                        <i className="fas fa-store"></i>
                    </div>
                    <div className="flex-1 relative">
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Retiro por sucursal</p>

                        <select 
                            value={sucursal} // Controlamos el select con React
                            onChange={cambiarSucursal} 
                            className="w-full bg-transparent font-black text-gray-800 text-sm outline-none cursor-pointer appearance-none relative z-10 pb-1"
                        >
                            <option value="santafe">Santa Fe Central</option>
                            <option value="santotome">Santo Tomé</option>
                        </select>

                        {/* Inyectamos la dirección dinámica desde el estado y aplicamos la opacidad */}
                        <p 
                            className="text-[11px] text-gray-500 font-medium transition-opacity duration-150" 
                            style={{ opacity: opacity }}
                        >
                            <i className="fas fa-map-marker-alt text-[#FF6600] mr-1"></i> 
                            {datosActivos.direccion}
                        </p>

                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <i className="fas fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}