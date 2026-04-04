import Carrusel from '../components/Carrusel';
import CatalogMain from '../components/CatalogMain';

export default function HomePage() {
  return (
    <main className="flex flex-col mx-auto py-8">
      <Carrusel />
      <CatalogMain />
    </main>
  );
}
