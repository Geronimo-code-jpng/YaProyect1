// Utility functions for ProfileModal

let openProfileRef: (() => void) | null = null;

export const setOpenProfileRef = (ref: () => void) => {
  openProfileRef = ref;
};

export const openProfile = () => {
  if (openProfileRef) {
    openProfileRef();
  }
};
