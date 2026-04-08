// Utility functions for PedidosModal

let openPedidosRef = null;

export const setOpenPedidosRef = (ref) => {
  openPedidosRef = ref;
};

export const openPedidos = () => {
  if (openPedidosRef) {
    openPedidosRef();
  }
};
