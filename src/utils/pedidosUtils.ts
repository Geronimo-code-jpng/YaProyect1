// Utility functions for PedidosModal

let openPedidosRef: (() => void) | null = null;

export const setOpenPedidosRef = (ref: () => void) => {
  openPedidosRef = ref;
};

export const openPedidos = () => {
  if (openPedidosRef) {
    openPedidosRef();
  }
};
