export const isBrowserProviderValid = (obj: any): boolean => {
  if (obj && typeof obj.request === "function") {
    return true;
  }
  return false;
};

export const isEthereumEvenEmitterValid = (obj: any): boolean => {
  if (
    obj &&
    typeof obj.on === "function" &&
    typeof obj.removeListener === "function"
  ) {
    return true;
  }
  return false;
};
