
export default function Footer() {
  return (
  <div>
    <footer className="bg-gray-900 text-white pt-12 pb-8 mt-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">


            <div>
                <h4 className="text-white font-black mb-4 uppercase tracking-wider text-sm">Ayuda y Soporte</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li><a href="#" className="hover:text-white transition">Preguntas Frecuentes</a></li>
                    <li><a href="#" className="hover:text-white transition">Plazos de Entrega</a></li>
                    <li><a href="#" className="hover:text-white transition">Términos y Condiciones</a></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-black mb-4 uppercase tracking-wider text-sm">Nuestras Redes</h4>
                <div className="mt-4 flex flex-col gap-4 text-2xl text-gray-500">
                    <i className="flex fab fa-instagram hover:text-[#FF6600] cursor-pointer">
                        <p className="font-serif text-lg">&nbsp;Instagram</p>
                    </i>
                    <i className="flex fab fa-facebook hover:text-[#FF6600] cursor-pointer">
                        <p className="font-serif text-lg">&nbsp;Facebook</p>
                    </i>
                </div>
            </div>

            <div>
                <h4 className="text-white font-black mb-4 uppercase tracking-wider text-sm">Contacto Directo</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li><p>hola@gmail.com</p></li>
                    <li><p>34259590000</p></li>
                    <li><p>boulevard 1900</p></li>
                </ul>
            </div>
        </div>
        <div
            className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-600 text-[10px] uppercase tracking-widest font-bold">
            © 2026 - Sistema de Gestión Retail - Todos los derechos reservados
        </div>
    </footer>
  </div>    
  )
}
