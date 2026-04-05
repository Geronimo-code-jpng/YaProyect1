import Carrusel from '../components/Carrusel';
import CategoriesSection from '../components/CategoriesSection';

export default function HomePage() {
  return (
    <main className="flex flex-col mx-auto">
      <Carrusel />
      <CategoriesSection />
    </main>
  );
}
