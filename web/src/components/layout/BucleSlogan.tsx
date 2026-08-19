// Componente interno para no repetir código
const PhraseGroup = () => (
  <div className="flex items-center justify-center w-screen">
    <div className="mx-10 flex items-center gap-2">
      <img
        className="w-6 h-6"
        src="https://diaio.vtexassets.com/arquivos/envio-moto-header_bajo.gif"
        alt="Envío"
      />
      <p className="text-sm py-1 text-gray-700">
        Si sos de <strong>Santa Fe</strong>, tu envío llega{" "}
        <strong>en el día</strong>
      </p>
    </div>
  </div>
);

export default PhraseGroup;
