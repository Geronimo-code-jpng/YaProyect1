import { useState } from "react";
import NavBar from "./components/NavBar";
import "./Global.css";
import Footer from "./components/Footer";
import Carrusel from "./components/Carrusel";
import Espacio from "./components/Espacio";
import QEB from "./components/QEB";
import CardCatalogo from "./components/CardCatalogo";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <NavBar />
      <Espacio />
      <Carrusel />
      <QEB />
      <CardCatalogo />
      <Footer />
    </>
  );
}

export default App;
