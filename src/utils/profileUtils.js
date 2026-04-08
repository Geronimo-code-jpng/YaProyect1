// Utility functions for ProfileModal

let openProfileRef = null;

export const setOpenProfileRef = (ref) => {
  openProfileRef = ref;
};

export const openProfile = () => {
  if (openProfileRef) {
    openProfileRef();
  }
};
