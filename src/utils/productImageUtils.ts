import { Product } from '../types';

const IMAGE_CATEGORY_MAP: Record<string, string> = {
  'ACEITE': '/aceite.jpg',
  'ALIMENTO': '/arroz.jpg',
  'AZUCAR': '/azucar.jpg',
  'BEBIDAS': '/gaseosas.jpg',
  'CERVEZAS': '/cervezas.jpg',
  'LACTEOS': '/lacteos.jpg',
  'HARINA': '/harina.jpg',
  'VINOS': '/vinos.jpg',
  'YERBA': '/yerba.jpg',
  'APERITIVOS': '/aperitivos.jpg',
  'LIMPIEZA': '/limpieza.jpg',
  'SALES': '/sales.jpg',
};

export function getProductImageUrl(product: Product): string {
  if (product.Imagen || product.imagen) {
    return (product.Imagen || product.imagen) as string;
  }

  if (product.Categoria) {
    const imagePath = IMAGE_CATEGORY_MAP[product.Categoria.toUpperCase()];
    if (imagePath) return imagePath;
  }

  return 'https://via.placeholder.com/200/f3f4f6/a1a1aa?text=Prod';
}
