import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProductModal({ isOpen, onClose, product, productId, onSave }) {
  const [formOverrides, setFormOverrides] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si se recibe productId, buscar el producto en la base de datos
  useEffect(() => {
    if (productId && isOpen && !product) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("productos")
            .select("*")
            .eq("Id", productId)
            .single();
          
          if (error) {
            console.error("Error cargando producto:", error);
            alert("Error al cargar el producto");
          } else {
            setProductData(data);
            console.log(data)
          }
        } catch (err) {
          console.error("Error inesperado:", err);
          alert("Error al cargar el producto");
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [productId, isOpen, product]);

  // Usar product si se pasa directamente, sino usar productData (cargado por ID)
  const currentProduct = product || productData;
  
  const formData = useMemo(() => ({
    nombre: currentProduct?.nombre || '',
    precio: currentProduct?.precio || 0,
    Categoria: currentProduct?.Categoria || '',
    Oferta: currentProduct?.Oferta || '',
    Stock: currentProduct?.Stock ?? false,
    imageFile: imageFile,
    ...formOverrides
  }), [currentProduct, imageFile, formOverrides]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;
    
    // Convertir string a boolean para el campo Stock
    if (name === 'Stock') {
      if (value === 'true') {
        processedValue = true;
      } else if (value === 'false') {
        processedValue = false;
      } else {
        processedValue = '';
      }
      // Guardar como 'Stock' para mantener consistencia con formData
      setFormOverrides(prev => ({
        ...prev,
        Stock: processedValue
      }));
      return;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormOverrides(prev => ({
      ...prev,
      [name]: processedValue
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

      // Guardar el archivo para procesarlo en AdminPanel
      setImageFile(file);
      console.log('Imagen seleccionada para reemplazo:', file.name);
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
      Oferta: formData.Oferta.trim(),
      Stock: Boolean(formData.Stock)
    };

    // Si hay un archivo de imagen, incluirlo
    if (formData.imageFile) {
      productData.imageFile = formData.imageFile;
    }

    onSave(productData);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
            <p className="text-lg font-bold text-gray-500">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900">
              {currentProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                  Stock *
                </label>
                <select
                  name="Stock"
                  value={formData.Stock}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  required
                >
                  <option value="">Seleccionar estado de stock</option>
                  <option value={true}>Hay stock</option>
                  <option value={false}>No hay stock</option>
                </select>
                {formData.Stock !== undefined && formData.Stock !== null && (
                  <div className="mt-2">
                    <span className={`text-sm font-medium ${
                      formData.Stock ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.Stock ? 'Hay stock' : 'No hay stock'}
                    </span>
                  </div>
                )}
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
                  <option value="HARINA">Harinas</option>
                  <option value="ACEITE">Aceites</option>
                  <option value="AZUCAR">Azúcares</option>
                  <option value="VINOS">Vinos</option>
                  <option value="CERVEZAS">Cervezas</option>
                  <option value="YERBA">Yerbas</option>
                  <option value="APERITIVOS">Aperitivos</option>
                  <option value="CIGARRILLOS">Cigarrillos</option>
                </select>
              </div>

              {/* Imagen - Solo para edición */}
              {currentProduct && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Reemplazar Imagen del Producto
                  </label>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 mb-2">
                        <i className="fas fa-cloud mr-2"></i>
                        <strong>Almacenamiento en Supabase Storage:</strong>
                      </p>
                      <div className="text-sm text-blue-700 space-y-2">
                        <p><strong>Sistema:</strong> La imagen se sube a Supabase Storage (1 GB gratuito).</p>
                        <p><strong>Proceso:</strong> Subida directa con URL pública automática.</p>
                        <p><strong>Resultado:</strong> La imagen se almacenará en la nube y será visible inmediatamente.</p>
                        <p class="text-xs text-blue-600 mt-2">Espacio ilimitado para imágenes. Profesional y escalable. Ideal para Vercel.</p>
                      </div>
                    </div>
                    
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
                      {imageFile && (
                        <div className="mt-2 text-sm text-green-600">
                          <i className="fas fa-check mr-1"></i>
                          Archivo seleccionado: {imageFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              
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
                {currentProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
