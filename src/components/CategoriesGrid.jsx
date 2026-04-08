import React from 'react';

export default function CategoriesGrid({ categories, onCategoryClick }) {
  return (
    <div id="categoriasGrid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {categories.map((cat) => (
        <div
          key={cat.id}
          onClick={() => onCategoryClick(cat.id)}
          className="rounded-2xl cursor-pointer transform transition hover:-translate-y-2 hover:shadow-xl flex flex-col items-center justify-center text-center h-40 relative overflow-hidden group bg-gray-200"
        >
          <img
            src={cat.imagen}
            alt={cat.nombre}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition" />
          <h3 className="relative z-10 text-white font-black text-lg md:text-xl tracking-wide leading-tight px-3 drop-shadow-lg">
            {cat.nombre}
          </h3>
        </div>
      ))}
    </div>
  );
}
