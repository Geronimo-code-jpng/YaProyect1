export const createToken = (): string => {
  const array = new Uint8Array(6);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};
