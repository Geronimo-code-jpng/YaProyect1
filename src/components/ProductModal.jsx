import { useState, useMemo } from 'react';

export default function ProductModal({ isOpen, onClose, product, onSave }) {
  const [formOverrides, setFormOverrides] = useState({});
  const [imageFile, setImageFile] = useState(null);

  const formData = useMemo(() => ({
    nombre: product?.nombre || '',
    precio: product?.precio || 0,
    Categoria: product?.Categoria || '',
    Imagen: product?.Imagen || '',
    Oferta: product?.Oferta || '',
    stock: product?.stock || 0,
    imageFile: imageFile,
    ...formOverrides
  }), [product, imageFile, formOverrides]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormOverrides(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.)');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB');
        return;
      }

      // Crear URL para vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(file);
        setFormOverrides(prev => ({
          ...prev,
          Imagen: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }
    
    if (formData.precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    
    if (!formData.Categoria.trim()) {
      alert('La categoría es obligatoria');
      return;
    }

    // Preparar datos para guardar
    const productData = {
      nombre: formData.nombre.trim(),
      precio: parseFloat(formData.precio),
      Categoria: formData.Categoria.trim(),
      Imagen: formData.Imagen || '',
      Oferta: formData.Oferta.trim(),
      stock: parseInt(formData.stock) || 0
    };

    // Si hay un archivo de imagen, incluirlo
    if (formData.imageFile) {
      productData.imageFile = formData.imageFile;
    }

    onSave(productData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  placeholder="Ej: Coca Cola 2.25L"
                  required
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  placeholder="0"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="Categoria"
                  value={formData.Categoria}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="ALIMENTO">Alimentos</option>
                  <option value="BEBIDAS">Bebidas</option>
                  <option value="LACTEOS">Lácteos</option>
                  <option value="HARINA">Harina</option>
                  <option value="ACEITE">Aceite</option>
                  <option value="VINOS">Vinos</option>
                  <option value="CERVEZAS">Cervezas</option>
                  <option value="YERBA">Yerba</option>
                  <option value="APERITIVOS">Aperitivos</option>
                </select>
              </div>

              {/* Imagen */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Imagen del Producto
                </label>
                <div className="space-y-3">
                  {/* Campo para subir imagen */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF6600] file:text-white hover:file:bg-orange-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG, GIF. Máximo 5MB
                    </p>
                  </div>
                  
                  {/* Campo para URL (opcional) */}
                  <div>
                    <input
                      type="text"
                      name="Imagen"
                      value={formData.Imagen && !formData.imageFile ? formData.Imagen : ''}
                      onChange={(e) => {
                        if (!imageFile) {
                          handleChange(e);
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                      placeholder="O ingresa URL de imagen (opcional)"
                      disabled={imageFile}
                    />
                  </div>
                </div>
              </div>

              {/* Oferta */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Texto de Oferta (opcional)
                </label>
                <input
                  type="text"
                  name="Oferta"
                  value={formData.Oferta}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  placeholder="Ej: 20% OFF, 2x1, Llévate 3 paga 2"
                />
              </div>
            </div>

            {/* Vista previa de la imagen */}
            {formData.Imagen && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Vista Previa de Imagen
                </label>
                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                  <img
                    src={formData.Imagen}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden text-center text-gray-500 py-8">
                    <i className="fas fa-image text-4xl mb-2"></i>
                    <p>No se pudo cargar la imagen</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl transition"
              >
                {product ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
