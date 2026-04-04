import React from 'react';

export default function CatalogHeader() {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm">
      <span className="text-sm font-black text-[#FF6600] bg-orange-100 px-4 py-1.5 rounded-full uppercase" id="resultsCount"></span>
      <h2 className="text-3xl md:text-4xl font-black text-zinc-800 tracking-tight" id="tituloSeccion"></h2>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-2.5 rounded-xl min-w-[280px] hover:border-orange-300 transition">
        <div className="bg-[#FF6600] text-white w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm">
          <i className="fas fa-store"></i>
        </div>
        <div className="flex-1 relative">
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Retiro por sucursal</p>
          <select id="sucursalSelect" className="w-full bg-transparent font-black text-gray-800 text-sm outline-none cursor-pointer appearance-none relative z-10 pb-1">
            <option value="santafe">Santa Fe Central</option>
            <option value="santotome">Santo Tomé</option>
          </select>
          <p id="headerBranchAddress" className="text-[11px] text-gray-500 font-medium">
            <i className="fas fa-map-marker-alt text-[#FF6600] mr-1"></i> Pedro de Vega 3220
          </p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <i className="fas fa-chevron-down text-xs"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
